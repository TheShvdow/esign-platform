import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { Signature } from '../entities/signature.entity';
import { AuditLog } from '../entities/audit-log.entity';
import {
  UserRole,
  DocumentStatus,
  AuditAction,
} from '../types/global.types';
import {
  AdminAuditEntryDto,
  AdminDailyCount,
  AdminDocumentsListResponseDto,
  AdminStatsDto,
  AdminUpdateUserDto,
  AdminUserRowDto,
} from '../dto/admin.dto';
import { AuditService } from './audit.service';
import type { AuditDetails } from '../types/global.types';
import { DocumentMapperService } from './document-mapper.service';
import { StorageService } from './storage.service';
import type { DocumentDto } from '../dto/document.dto';
import type {
  AdminAuditQueryDto,
  AdminDocumentsQueryDto,
  AdminPatchDocumentStatusDto,
  AdminUsersQueryDto,
} from '../dto/admin-query.dto';

const TREND_DAYS = 30;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Signature)
    private readonly signatureRepository: Repository<Signature>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly auditService: AuditService,
    private readonly documentMapper: DocumentMapperService,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async getStats(): Promise<AdminStatsDto> {
    const [userTotal, userActive] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    const roleRows = await this.userRepository
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany<{ role: UserRole; count: string }>();

    const byRole: Partial<Record<UserRole, number>> = {};
    for (const r of roleRows) {
      byRole[r.role] = parseInt(r.count, 10);
    }

    const docTotal = await this.documentRepository.count();
    const statusRows = await this.documentRepository
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('d.status')
      .getRawMany<{ status: DocumentStatus; count: string }>();

    const byStatus: Partial<Record<DocumentStatus, number>> = {};
    for (const s of statusRows) {
      byStatus[s.status] = parseInt(s.count, 10);
    }

    const sumRow = await this.documentRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.fileSize), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    const totalBytes = BigInt(sumRow?.sum ?? '0');

    const [sigTotal, auditTotal] = await Promise.all([
      this.signatureRepository.count(),
      this.auditRepository.count(),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const entriesLast7Days = await this.auditRepository.count({
      where: { createdAt: MoreThan(sevenDaysAgo) },
    });

    const [documentsPerDay, usersPerDay, signaturesPerDay] = await Promise.all([
      this.buildDailySeriesFromSql(
        `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
         FROM documents WHERE created_at >= $1 GROUP BY 1 ORDER BY 1`,
        TREND_DAYS,
      ),
      this.buildDailySeriesFromSql(
        `SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
         FROM users WHERE "createdAt" >= $1 GROUP BY 1 ORDER BY 1`,
        TREND_DAYS,
      ),
      this.buildDailySeriesFromSql(
        `SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
         FROM signatures WHERE "createdAt" >= $1 GROUP BY 1 ORDER BY 1`,
        TREND_DAYS,
      ),
    ]);

    return {
      users: {
        total: userTotal,
        active: userActive,
        byRole,
      },
      documents: {
        total: docTotal,
        byStatus,
        totalBytesStored: totalBytes.toString(),
      },
      signatures: { total: sigTotal },
      audit: { entriesLast7Days, totalEntries: auditTotal },
      trends: {
        trendDays: TREND_DAYS,
        documentsPerDay,
        usersPerDay,
        signaturesPerDay,
      },
    };
  }

  /** Agrège les lignes SQL et remplit les jours sans donnée avec 0 (UTC). */
  private async buildDailySeriesFromSql(
    sql: string,
    days: number,
  ): Promise<AdminDailyCount[]> {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const rows = await this.documentRepository.query(sql, [from]);
    const map = new Map<string, number>();
    for (const r of rows as { d: string; c: string | number }[]) {
      const c = r.c;
      map.set(
        r.d,
        typeof c === 'string' ? parseInt(c, 10) : c,
      );
    }

    const out: AdminDailyCount[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: map.get(key) ?? 0 });
    }
    return out;
  }

  async listDocuments(
    query: AdminDocumentsQueryDto,
    actor: User,
  ): Promise<AdminDocumentsListResponseDto> {
    const safeLimit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const safePage = Math.max(query.page ?? 1, 1);

    const qb = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.owner', 'owner')
      .leftJoinAndSelect('doc.signatures', 'signatures')
      .leftJoinAndSelect('signatures.signer', 'signer');

    if (query.status) {
      qb.andWhere('doc.status = :status', { status: query.status });
    }
    if (query.ownerId) {
      qb.andWhere('doc.ownerId = :ownerId', { ownerId: query.ownerId });
    }
    if (query.q?.trim()) {
      qb.andWhere('doc.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }
    if (query.dateFrom) {
      qb.andWhere('doc.createdAt >= :df', {
        df: new Date(query.dateFrom),
      });
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('doc.createdAt <= :dt', { dt: end });
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const sortCol =
      sortBy === 'title'
        ? 'doc.title'
        : sortBy === 'fileSize'
          ? 'doc.fileSize'
          : 'doc.createdAt';
    qb.orderBy(sortCol, sortOrder);

    const [docs, total] = await qb
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    const documents: DocumentDto[] = this.documentMapper.toDtoList(docs, actor);

    return {
      documents,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async updateDocument(
    id: string,
    dto: AdminPatchDocumentStatusDto,
    actor: User,
  ): Promise<DocumentDto> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner', 'signatures', 'signatures.signer'],
    });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    const prevStatus = doc.status;
    doc.status = dto.status;
    await this.documentRepository.save(doc);

    await this.auditService.log({
      action: AuditAction.DOCUMENT_UPDATE,
      userId: actor.id,
      entityType: 'Document',
      entityId: doc.id,
      details: {
        previousStatus: prevStatus,
        newStatus: dto.status,
      } as AuditDetails,
    });

    const reloaded = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner', 'signatures', 'signatures.signer'],
    });
    if (!reloaded) {
      throw new NotFoundException('Document introuvable');
    }
    return this.documentMapper.toDto(reloaded, actor);
  }

  async deleteDocument(id: string, actor: User): Promise<void> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    const storageKey = doc.storageKey;

    await this.dataSource.transaction(async (em) => {
      await em.getRepository(Signature).delete({ documentId: id });
      await em.getRepository(Document).delete({id});
    });

    await this.storageService.delete(storageKey);

    await this.auditService.log({
      action: AuditAction.DOCUMENT_DELETE,
      userId: actor.id,
      entityType: 'Document',
      entityId: id,
      details: {
        title: doc.title,
        originalName: doc.originalName,
      } as AuditDetails,
    });
  }

  async listUsers(
    query: AdminUsersQueryDto,
  ): Promise<{ users: AdminUserRowDto[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const safePage = Math.max(query.page ?? 1, 1);

    const qb = this.userRepository.createQueryBuilder('u');

    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }
    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      qb.andWhere(
        '(u.email ILIKE :t OR u.firstName ILIKE :t OR u.lastName ILIKE :t)',
        { t: term },
      );
    }

    qb.orderBy('u.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [rows, total] = await qb.getManyAndCount();

    const users: AdminUserRowDto[] = rows.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      mfaEnabled: u.mfaEnabled,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    }));

    return { users, total, page: safePage, limit: safeLimit };
  }

  async createUser(
    dto: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role?: UserRole;
    },
    actor: User,
  ): Promise<AdminUserRowDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Un utilisateur existe déjà avec ce courriel.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? UserRole.USER,
      passwordHash,
      isActive: true,
      emailVerified: false,
      mfaEnabled: false,
    });

    const saved = await this.userRepository.save(user);

    await this.auditService.log({
      action: AuditAction.USER_REGISTER,
      userId: actor.id,
      entityType: 'User',
      entityId: saved.id,
      details: {
        role: saved.role,
      } as AuditDetails,
    });

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
      isActive: saved.isActive,
      emailVerified: saved.emailVerified,
      mfaEnabled: saved.mfaEnabled,
      createdAt: saved.createdAt.toISOString(),
      lastLoginAt: saved.lastLoginAt ? saved.lastLoginAt.toISOString() : null,
    };
  }

  async updateUser(
    userId: string,
    dto: AdminUpdateUserDto,
    actor: User,
  ): Promise<AdminUserRowDto> {
    const target = await this.userRepository.findOne({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (dto.role !== undefined) {
      await this.assertRoleChangeSafe(target, dto.role, actor);
      target.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      await this.assertActiveChangeSafe(target, dto.isActive, actor);
      target.isActive = dto.isActive;
    }

    await this.userRepository.save(target);

    const details: AuditDetails = {
      targetUserId: target.id,
      ...(dto.role !== undefined && { newRole: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    await this.auditService.log({
      action: AuditAction.USER_UPDATE,
      userId: actor.id,
      entityType: 'User',
      entityId: target.id,
      details,
    });

    const refreshed = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'emailVerified',
        'mfaEnabled',
        'createdAt',
        'lastLoginAt',
      ],
    });
    if (!refreshed) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      id: refreshed.id,
      email: refreshed.email,
      firstName: refreshed.firstName,
      lastName: refreshed.lastName,
      role: refreshed.role,
      isActive: refreshed.isActive,
      emailVerified: refreshed.emailVerified,
      mfaEnabled: refreshed.mfaEnabled,
      createdAt: refreshed.createdAt.toISOString(),
      lastLoginAt: refreshed.lastLoginAt
        ? refreshed.lastLoginAt.toISOString()
        : null,
    };
  }

  private async assertRoleChangeSafe(
    target: User,
    newRole: UserRole,
    actor: User,
  ): Promise<void> {
    if (target.id === actor.id && target.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const admins = await this.userRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (admins <= 1) {
        throw new BadRequestException(
          'Impossible de retirer le rôle administrateur : vous êtes le dernier administrateur actif.',
        );
      }
    }
  }

  private async assertActiveChangeSafe(
    target: User,
    active: boolean,
    actor: User,
  ): Promise<void> {
    if (!active && target.id === actor.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas désactiver votre propre compte depuis cette interface.',
      );
    }
    if (!active && target.role === UserRole.ADMIN) {
      const admins = await this.userRepository.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (admins <= 1) {
        throw new BadRequestException(
          'Impossible de désactiver le dernier administrateur actif.',
        );
      }
    }
  }

  async listAuditLogs(query: AdminAuditQueryDto): Promise<{
    items: AdminAuditEntryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const safeLimit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const safePage = Math.max(query.page ?? 1, 1);

    const qb = this.auditRepository.createQueryBuilder('a');

    if (query.action) {
      qb.andWhere('a.action = :action', { action: query.action });
    }
    if (query.userId) {
      qb.andWhere('a.userId = :userId', { userId: query.userId });
    }
    if (query.dateFrom) {
      qb.andWhere('a.createdAt >= :df', { df: new Date(query.dateFrom) });
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('a.createdAt <= :dt', { dt: end });
    }

    qb.orderBy('a.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [rows, total] = await qb.getManyAndCount();

    const items: AdminAuditEntryDto[] = rows.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt.toISOString(),
    }));

    return { items, total, page: safePage, limit: safeLimit };
  }
}
