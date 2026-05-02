// src/types/signature.types.ts
import { AuthenticatedRequest } from './request.types';
import type { Document } from '../entities/document.entity';
import type { User } from '../entities/user.entity';
import type { SignDocumentDto } from '../dto/document.dto';
import type { SignatureResult } from '../services/cryptography.service';

export interface Pkcs7AuthenticatedAttribute {
  type: string;
  value?: string;
}

export enum SignatureType {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED',
  QUALIFIED = 'QUALIFIED'
}

export interface SignatureMetadata {
  ipAddress: string;
  userAgent: string;
  location?: string;
  deviceInfo?: string;
  reason?: string;
  signedAt: Date;
}

export interface SignatureAdditionalMetadata {
  location?: string;
  deviceInfo?: string;
  reason?: string;
}

export interface SignatureVerificationResult {
  signatureId: string;
  isValid: boolean;
  errors?: string[];
}

export interface SignatureCreationContext {
  document: Document;
  user: User;
  signDto: SignDocumentDto;
  signatureResult: SignatureResult;
  request: AuthenticatedRequest;
}

export interface SigningOptions {
  authenticatedAttributes: Pkcs7AuthenticatedAttribute[];
}
