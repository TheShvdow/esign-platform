// src/types/global.types.ts

// ✅ Enums pour les statuts et types
export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  FULLY_SIGNED = 'FULLY_SIGNED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum SignatureType {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED',
  QUALIFIED = 'QUALIFIED'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ✅ Enum AuditAction pour corriger les erreurs
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

// ✅ Interface pour les preuves cryptographiques
export interface CryptographicEvidence {
  hash: string;
  algorithm: string;
  timestamp: Date;
  certificateChain: string[];
  tsaResponse?: string; // Time Stamping Authority response
  ocspResponse?: string; // Online Certificate Status Protocol
  crlUrl?: string; // Certificate Revocation List
}

export interface SignatureMetadata {
  ipAddress: string;
  userAgent: string;
  location?: string; // Optionnel, peut être rempli via géolocalisation IP
  deviceInfo?: string; // Optionnel, informations sur l'appareil
  reason?: string; // Raison de la signature
  signedAt: Date;
}

// ✅ Interface pour les requêtes d'audit
export interface AuditLogRequest {
  action: AuditAction;
  userId: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ✅ Interface pour les options de stockage
export interface StorageOptions {
  fileName: string;
  mimeType: string;
  ownerId: string;
  encryption?: boolean;
  retention?: number; // Durée de rétention en jours
}

// ✅ Types pour les certificats
export interface CertificateInfo {
  id: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  keyUsage: string[];
  isRevoked: boolean;
}

// ✅ Types pour les événements
export interface DocumentEvent {
  document: any; // Remplacer par votre entité Document
  user: any; // Remplacer par votre entité User
  signature?: any; // Remplacer par votre entité Signature
}

// ✅ Types pour les réponses d'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ✅ Types pour la sécurité
export interface SecurityContext {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

// ✅ Types pour la configuration
export interface AppConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  storage: {
    provider: 'aws' | 'azure' | 'gcp' | 'local';
    bucket: string;
    region?: string;
  };
  hsm: {
    provider: string;
    endpoint: string;
    credentials: Record<string, any>;
  };
  tsa: {
    url: string;
    credentials?: Record<string, any>;
  };
}

// ✅ Types pour les notifications
export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'sms' | 'push';
  variables: string[];
}

export interface NotificationRequest {
  to: string[];
  template: string;
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: Date;
}