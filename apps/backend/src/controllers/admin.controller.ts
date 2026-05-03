import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../types/global.types';
import type { AuthenticatedRequest } from '../types/request.types';
import { AdminService } from '../services/admin.service';
import {
  AdminAuditListResponseDto,
  AdminCreateUserDto,
  AdminDocumentsListResponseDto,
  AdminStatsDto,
  AdminUpdateUserDto,
  AdminUserRowDto,
  AdminUsersListResponseDto,
} from '../dto/admin.dto';
import {
  AdminAuditQueryDto,
  AdminDocumentsQueryDto,
  AdminPatchDocumentStatusDto,
  AdminUsersQueryDto,
} from '../dto/admin-query.dto';
import type { DocumentDto } from '../dto/document.dto';

@ApiTags('Administration')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Indicateurs plateforme + séries temporelles (30 j.)',
  })
  async stats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }

  @Get('documents')
  @ApiOperation({
    summary: 'Liste documents (filtres avancés, tri)',
    description:
      'Filtres : status, ownerId, q (titre), dateFrom, dateTo, tri par createdAt|title|fileSize.',
  })
  async listDocuments(
    @Query() query: AdminDocumentsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminDocumentsListResponseDto> {
    return this.adminService.listDocuments(query, req.user);
  }

  @Patch('documents/:id')
  @ApiOperation({
    summary: 'Changer le statut d\'un document (ex. archiver, rejeter)',
  })
  async patchDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPatchDocumentStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DocumentDto> {
    return this.adminService.updateDocument(id, dto, req.user);
  }

  @Delete('documents/:id')
  @ApiOperation({
    summary: 'Supprimer un document (fichier + base + signatures)',
  })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.adminService.deleteDocument(id, req.user);
    return { ok: true };
  }

  @Get('users')
  @ApiOperation({ summary: 'Utilisateurs (pagination, rôle, recherche texte)' })
  async listUsers(
    @Query() query: AdminUsersQueryDto,
  ): Promise<AdminUsersListResponseDto> {
    return this.adminService.listUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  async createUser(
    @Body() dto: AdminCreateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminUserRowDto> {
    return this.adminService.createUser(dto, req.user);
  }

  @Patch('users/:id')
  @ApiOperation({
    summary: 'Mettre à jour rôle ou statut actif',
  })
  async patchUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminUserRowDto> {
    return this.adminService.updateUser(id, dto, req.user);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Journal d’audit (filtres action, user, période)' })
  async audit(
    @Query() query: AdminAuditQueryDto,
  ): Promise<AdminAuditListResponseDto> {
    return this.adminService.listAuditLogs(query);
  }
}
