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
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  mfaSecret?: string;

  @Column({ default: false })
  mfaEnabled!: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLoginIp?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Document, (document) => document.owner)
  documents!: Document[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];

  // Méthodes utilitaires
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Hiérarchie de permission : un rôle « supérieur » satisfait les contraintes des rôles inférieurs
   * (ex. ADMIN peut tout faire ; DIRECTOR inclut les contraintes MANAGER si codées ainsi).
   */
  hasRole(role: UserRole): boolean {
    const rank: Record<UserRole, number> = {
      [UserRole.ADMIN]: 100,
      [UserRole.DIRECTOR]: 80,
      [UserRole.MANAGER]: 60,
      [UserRole.VALIDATOR]: 40,
      [UserRole.USER]: 20,
    };
    return rank[this.role] >= rank[role];
  }
}
