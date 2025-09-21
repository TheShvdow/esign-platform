// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../types/global.types';
import { Document } from './document.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  mfaSecret?: string;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLoginIp?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  // Méthodes utilitaires
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasRole(role: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 1,
      [UserRole.USER]: 2,
    };
    return roleHierarchy[this.role] >= roleHierarchy[role];
  }
}
