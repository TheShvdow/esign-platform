export interface WorkflowStep {
  order: number;
  label?: string;
  assigneeUserId?: string;
  allowedRoles?: string[];
}

export interface DocumentMetadata {
  requiredSignatures?: number;
  workflow?: WorkflowStep[];
  participantUserIds?: string[];
  department?: string;
  businessUnit?: string;
  tags?: string[];
}

export interface DocumentDto {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  status: DocumentStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  owner: UserDto;
  signatures: SignatureDto[];
  metadata?: DocumentMetadata;
  workflowSummary?: {
    mode: 'sequential' | 'parallel';
    stepsTotal: number;
    signaturesCompleted: number;
  };
  /** Indique si l’utilisateur connecté peut signer à cet instant (calcul serveur). */
  maySign?: boolean;
}

export interface CreateDocumentDto {
  title: string;
  description?: string;
}

export interface SignDocumentDto {
  signatureType: SignatureType;
  certificateId: string;
  additionalMetadata?: {
    reason?: string;
    location?: string;
    deviceInfo?: string;
  };
}

export interface DocumentsListResponse {
  documents: DocumentDto[];
  total: number;
  page: number;
  limit: number;
}

export interface SignatureDto {
  id: string;
  type: SignatureType;
  certificateId: string;
  isValid: boolean;
  createdAt: string;
  validationErrors?: string;
  signer: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface DocumentVerificationResult {
  isValid: boolean;
  signatures: {
    signatureId: string;
    isValid: boolean;
    errors?: string[];
  }[];
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  FULLY_SIGNED = 'FULLY_SIGNED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum SignatureType {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED',
  QUALIFIED = 'QUALIFIED',
}
