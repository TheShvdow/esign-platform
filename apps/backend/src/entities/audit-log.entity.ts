// src/entities/audit-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditAction } from '../types/global.types';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
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
  details: Record<string, unknown>;

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
