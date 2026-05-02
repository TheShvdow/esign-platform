// src/entities/document.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Signature } from './signature.entity';
import {
  DocumentMetadata,
  DocumentStatus,
  WorkflowStep,
} from '../types/global.types';

@Entity('documents')
@Index(['ownerId', 'status'])
@Index(['fileHash'])
@Index(['createdAt'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'original_name', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize!: number;

  @Column({ name: 'storage_key', length: 500 })
  storageKey!: string;

  @Column({ name: 'file_hash', length: 128 })
  fileHash!: string;

  @Column({ name: 'hash_algorithm', length: 50, default: 'sha256' })
  hashAlgorithm!: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING_SIGNATURE,
  })
  status!: DocumentStatus;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: DocumentMetadata;

  // Relations
  @Column({ name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.documents, {
    onDelete: 'CASCADE',
    eager: false
  })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Signature, (signature) => signature.document, {
    cascade: true,
    eager: false
  })
  signatures!: Signature[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Méthodes utilitaires
  getOrderedWorkflow(): WorkflowStep[] {
    const raw = this.metadata?.workflow;
    if (!raw?.length) {
      return [];
    }
    return [...raw].sort((a, b) => a.order - b.order);
  }

  hasUserAlreadySigned(userId: string): boolean {
    return !!this.signatures?.some((s) => s.signerId === userId);
  }

  /**
   * Qui peut signer maintenant : workflow séquentiel (étape / rôle / assigné)
   * ou mode parallèle (propriétaire + participants).
   */
  canBeSignedBy(user: User): boolean {
    if (
      this.status !== DocumentStatus.PENDING_SIGNATURE &&
      this.status !== DocumentStatus.PARTIALLY_SIGNED
    ) {
      return false;
    }

    if (this.hasUserAlreadySigned(user.id)) {
      return false;
    }

    const workflow = this.getOrderedWorkflow();
    if (workflow.length > 0) {
      const stepIndex = this.getCurrentSignatureCount();
      const step = workflow[stepIndex];
      if (!step) {
        return false;
      }
      if (step.assigneeUserId) {
        return user.id === step.assigneeUserId;
      }
      if (step.allowedRoles?.length) {
        return step.allowedRoles.includes(user.role);
      }
      return false;
    }

    const participants = this.metadata?.participantUserIds ?? [];
    const required = this.getRequiredSignatures();
    if (required > 1 || participants.length > 0) {
      const eligible = new Set<string>([this.ownerId, ...participants]);
      return eligible.has(user.id);
    }

    return user.id === this.ownerId;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  getRequiredSignatures(): number {
    const wf = this.getOrderedWorkflow();
    if (wf.length > 0) {
      return wf.length;
    }
    const requiredSignatures = this.metadata?.requiredSignatures;
    return typeof requiredSignatures === 'number' && requiredSignatures >= 1
      ? requiredSignatures
      : 1;
  }

  getCurrentSignatureCount(): number {
    return this.signatures?.length || 0;
  }

  isFullySigned(): boolean {
    return this.getCurrentSignatureCount() >= this.getRequiredSignatures();
  }

  getSignatureProgress(): number {
    const required = this.getRequiredSignatures();
    const current = this.getCurrentSignatureCount();
    return Math.min((current / required) * 100, 100);
  }

  // Validation du document
  validateForSigning(): string[] {
    const errors: string[] = [];

    if (this.isExpired()) {
      errors.push('Document has expired');
    }

    if (this.status === DocumentStatus.FULLY_SIGNED) {
      errors.push('Document is already fully signed');
    }

    if (this.status === DocumentStatus.ARCHIVED) {
      errors.push('Cannot sign archived document');
    }

    if (this.status === DocumentStatus.REJECTED) {
      errors.push('Cannot sign rejected document');
    }

    return errors;
  }

  // Méthodes de workflow
  updateStatusBasedOnSignatures(): void {
    const required = this.getRequiredSignatures();
    const current = this.getCurrentSignatureCount();

    if (current >= required) {
      this.status = DocumentStatus.FULLY_SIGNED;
    } else if (current > 0) {
      this.status = DocumentStatus.PARTIALLY_SIGNED;
    } else {
      this.status = DocumentStatus.PENDING_SIGNATURE;
    }
  }

  // Métadonnées de signature
  getSignatureMetadata() {
    return {
      requiredSignatures: this.getRequiredSignatures(),
      currentSignatures: this.getCurrentSignatureCount(),
      progress: this.getSignatureProgress(),
      isComplete: this.isFullySigned(),
      canSign: !this.isExpired() && !this.isFullySigned(),
      workflowStepCount: this.getOrderedWorkflow().length,
    };
  }

  // Sérialisation pour API
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      fileName: this.fileName,
      originalName: this.originalName,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      fileHash: this.fileHash,
      status: this.status,
      expiresAt: this.expiresAt,
      metadata: this.metadata,
      signatureMetadata: this.getSignatureMetadata(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      owner: this.owner,
      signatures: this.signatures,
    };
  }
}