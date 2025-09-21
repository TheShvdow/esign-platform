// src/entities/signature.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type {
  SignatureMetadata,
  CryptographicEvidence,
} from '../types/global.types';
import { SignatureType } from '../types/global.types';
import { Document } from './document.entity';
import { User } from './user.entity';

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  documentId: string;

  @Column('uuid')
  signerId: string;

  @Column({
    type: 'enum',
    enum: SignatureType,
  })
  type: SignatureType;

  @Column('text')
  signatureValue: string;

  @Column('jsonb')
  metadata: SignatureMetadata;

  @Column('jsonb')
  cryptographicEvidence: CryptographicEvidence;

  @Column()
  certificateId: string;

  @Column('text')
  certificatePem: string;

  @Column({ nullable: true })
  tsaResponse?: string;

  @Column({ default: false })
  isValid: boolean;

  @Column({ nullable: true })
  validationErrors?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Document, (document) => document.signatures)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signerId' })
  signer: User;
}
