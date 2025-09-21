import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction } from '../types/global.types';
import * as crypto from 'crypto';

export interface AuditLogRequest {
  action: AuditAction;
  userId?: string;
  entityType?: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(request: AuditLogRequest): Promise<void> {
    const previousHash = await this.getLastHash();
    const currentHash = this.generateHash(request, previousHash);
    
    const auditLog = this.auditRepository.create({
      ...request,
      cryptographicHash: currentHash,
      previousHash,
      ipAddress: request.ipAddress || '127.0.0.1',
      userAgent: request.userAgent || 'Unknown',
      sessionId: request.sessionId || `session-${Date.now()}`,
      createdAt: new Date()
    });
    
    await this.auditRepository.save(auditLog);
  }

  private async getLastHash(): Promise<string> {
    const lastLog = await this.auditRepository.findOne({
      order: { createdAt: 'DESC' }
    });
    return lastLog?.cryptographicHash || 'genesis';
  }

  private generateHash(request: AuditLogRequest, previousHash: string): string {
    const data = JSON.stringify({ ...request, previousHash, timestamp: Date.now() });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}