// src/entities/audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditAction, AuditDetails } from '../types/global.types';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  constructor(
    id: string,
    action: AuditAction,
    details: AuditDetails,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    cryptographicHash: string,
    previousHash: string,
    createdAt: Date,
    userId?: string,
    entityType?: string,
    entityId?: string,
    user?: User,
  ) {
    this.id = id;
    this.action = action;
    this.details = details;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.sessionId = sessionId;
    this.cryptographicHash = cryptographicHash;
    this.previousHash = previousHash;
    this.createdAt = createdAt;
    this.userId = userId;
    this.entityType = entityType;
    this.entityId = entityId;
    this.user = user;
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column({ nullable: true })
  entityType?: string;

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column('jsonb')
  details: AuditDetails;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column()
  sessionId: string;

  @Column()
  cryptographicHash: string;

  @Column()
  previousHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
