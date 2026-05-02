// src/types/audit.types.ts

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  DOCUMENT_VIEW = 'DOCUMENT_VIEW',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_SIGN = 'DOCUMENT_SIGN',
  DOCUMENT_VERIFY = 'DOCUMENT_VERIFY',
  DOCUMENT_SHARE = 'DOCUMENT_SHARE',
  
  CERTIFICATE_CREATE = 'CERTIFICATE_CREATE',
  CERTIFICATE_REVOKE = 'CERTIFICATE_REVOKE',
  CERTIFICATE_RENEW = 'CERTIFICATE_RENEW',
  
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

export interface AuditLogRequest {
  action: AuditAction;
  userId: string;
  entityType: string;
  entityId: string;
  details?: AuditDetails;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentUploadAuditDetails {
  fileName: string;
  fileSize: number;
  fileHash: string;
}

export interface DocumentSignAuditDetails {
  signatureType: string;
  certificateId: string;
  signatureProgress: number;
}

export interface DocumentVerifyAuditDetails {
  isValid: boolean;
  signatureCount: number;
  requiredSignatures: number;
}

export type AuditDetails =
  | DocumentUploadAuditDetails
  | DocumentSignAuditDetails
  | DocumentVerifyAuditDetails
  | Record<string, string | number | boolean | null>;
