// src/types/signature.types.ts
import { AuthenticatedRequest } from './request.types';

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

export interface SignatureVerificationResult {
  signatureId: string;
  isValid: boolean;
  errors?: string[];
}

export interface SignatureCreationContext {
  document: any;
  user: any;
  signDto: any;
  signatureResult: any;
  request: AuthenticatedRequest;
}

export interface SigningOptions {
  authenticatedAttributes: any[];
}
