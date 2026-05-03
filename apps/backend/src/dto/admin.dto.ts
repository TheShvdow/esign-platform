import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole, DocumentStatus } from '../types/global.types';
import type { DocumentDto } from './document.dto';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export interface AdminDailyCount {
  date: string;
  count: number;
}

/** Réponse GET /admin/stats */
export interface AdminStatsDto {
  users: {
    total: number;
    active: number;
    byRole: Partial<Record<UserRole, number>>;
  };
  documents: {
    total: number;
    byStatus: Partial<Record<DocumentStatus, number>>;
    totalBytesStored: string;
  };
  signatures: { total: number };
  audit: { entriesLast7Days: number; totalEntries: number };
  /** Série sur trendDays (défaut 30) pour graphiques. */
  trends: {
    trendDays: number;
    documentsPerDay: AdminDailyCount[];
    usersPerDay: AdminDailyCount[];
    signaturesPerDay: AdminDailyCount[];
  };
}

export interface AdminDocumentsListResponseDto {
  documents: DocumentDto[];
  total: number;
  page: number;
  limit: number;
}

export class AdminCreateUserDto {
  @ApiProperty({
    example: 'marie.dupont@example.com',
    description: 'Adresse e-mail du nouvel utilisateur',
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse e-mail valide' })
  email!: string;

  @ApiProperty({
    example: 'Marie',
    description: 'Prénom',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Dupont',
    description: 'Nom',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    example: 'Motdepasse123',
    description: 'Mot de passe initial',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Rôle utilisateur',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export interface AdminUserRowDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUsersListResponseDto {
  users: AdminUserRowDto[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminAuditEntryDto {
  id: string;
  action: string;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface AdminAuditListResponseDto {
  items: AdminAuditEntryDto[];
  total: number;
  page: number;
  limit: number;
}
