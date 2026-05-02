// src/types/document.types.ts
import { SignatureVerificationResult } from './signature.types';
import type { UserRole } from './user.types';
import type { Document } from '../entities/document.entity';
import type { User } from '../entities/user.entity';
import type { Signature } from '../entities/signature.entity';

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  FULLY_SIGNED = 'FULLY_SIGNED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export interface DocumentEvent {
  document: Document;
  user: User;
  signature?: Signature;
}

/** Une étape du workflow de signature (ordre séquentiel). */
export interface WorkflowStep {
  /** Ordre d’exécution (1, 2, 3…). */
  order: number;
  /** Libellé affiché (ex. « Validation manager »). */
  label?: string;
  /** Si défini, seul cet utilisateur peut signer cette étape. */
  assigneeUserId?: string;
  /** Sinon : utilisateurs ayant l’un de ces rôles peuvent signer cette étape (hiérarchie métier). */
  allowedRoles?: UserRole[];
}

export interface DocumentMetadata {
  /** Nombre de signatures attendues si pas de `workflow` détaillé (mode parallèle). */
  requiredSignatures?: number;
  /**
   * Workflow séquentiel : chaque étape doit être signée dans l’ordre.
   * Si présent, sa longueur prime sur `requiredSignatures`.
   */
  workflow?: WorkflowStep[];
  /**
   * Utilisateurs autorisés à ouvrir et signer en mode parallèle (avec `requiredSignatures` > 1).
   * Le propriétaire est toujours autorisé implicitement.
   */
  participantUserIds?: string[];
  department?: string;
  businessUnit?: string;
  tags?: string[];
}

export interface DocumentVerificationResult {
  isValid: boolean;
  signatures: SignatureVerificationResult[];
}
