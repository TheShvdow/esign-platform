// src/entities/certificate.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  serialNumber: string;

  @Column()
  subject: string;

  @Column()
  issuer: string;

  @Column('text')
  certificatePem: string;

  @Column('text', { nullable: true })
  privateKeyPem?: string;

  @Column()
  notBefore: Date;

  @Column()
  notAfter: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  revocationReason?: string;

  @Column('jsonb', { nullable: true })
  keyUsage?: string[];

  @Column('jsonb', { nullable: true })
  extendedKeyUsage?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes utilitaires
  isExpired(): boolean {
    return new Date() > this.notAfter;
  }

  isValid(): boolean {
    const now = new Date();
    return !this.isRevoked && now >= this.notBefore && now <= this.notAfter;
  }
}
