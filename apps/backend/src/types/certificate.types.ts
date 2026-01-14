// src/types/certificate.types.ts

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
