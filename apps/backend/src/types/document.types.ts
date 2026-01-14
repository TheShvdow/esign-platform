// src/types/document.types.ts
import { SignatureVerificationResult } from './signature.types';

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
  document: any;
  user: any;
  signature?: any;
}

export interface DocumentVerificationResult {
  isValid: boolean;
  signatures: SignatureVerificationResult[];
}
