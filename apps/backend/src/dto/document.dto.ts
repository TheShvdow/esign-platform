// src/dto/document.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsDate, 
  IsEnum,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentMetadata, DocumentStatus, SignatureAdditionalMetadata, SignatureType } from '../types/global.types';
import { UserDto } from './auth.dto';

export class CreateDocumentDto {
  constructor(
    title: string,
    description?: string,
    expiresAt?: Date,
    metadata?: DocumentMetadata,
  ) {
    this.title = title;
    this.description = description;
    this.expiresAt = expiresAt;
    this.metadata = metadata;
  }

  @ApiProperty({
    example: 'Contract Agreement',
    description: 'Title of the document'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    example: 'Annual service contract',
    description: 'Description of the document',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: '2024-12-31T23:59:59Z',
    description: 'Document expiration date',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiProperty({ 
    description:
      'Métadonnées JSON : requiredSignatures, participantUserIds, workflow (étapes hiérarchiques). Peut être envoyée comme chaîne JSON en multipart.',
    example: {
      requiredSignatures: 2,
      participantUserIds: [],
      workflow: [
        { order: 1, allowedRoles: ['MANAGER'], label: 'Manager' },
        { order: 2, allowedRoles: ['DIRECTOR'], label: 'Direction' },
      ],
    },
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as DocumentMetadata;
      } catch {
        return undefined;
      }
    }
    return value;
  })
  metadata?: DocumentMetadata;
}

export class SignDocumentDto {
  constructor(
    signatureType: SignatureType,
    certificateId: string,
    additionalMetadata?: SignatureAdditionalMetadata,
  ) {
    this.signatureType = signatureType;
    this.certificateId = certificateId;
    this.additionalMetadata = additionalMetadata;
  }

  @ApiProperty({
    enum: SignatureType,
    description: 'Type of electronic signature'
  })
  @IsEnum(SignatureType)
  signatureType: SignatureType;

  @ApiProperty({
    example: 'cert-123',
    description: 'Certificate ID used for signing'
  })
  @IsString()
  certificateId: string;

  @ApiProperty({ 
    description: 'Additional metadata for the signature',
    example: { reason: 'I approve this contract', location: 'Paris, France' },
    required: false
  })
  @IsOptional()
  additionalMetadata?: SignatureAdditionalMetadata;
}

export class SignatureDto {
  constructor(
    id: string,
    type: SignatureType,
    certificateId: string,
    isValid: boolean,
    createdAt: Date,
    signer: UserDto,
  ) {
    this.id = id;
    this.type = type;
    this.certificateId = certificateId;
    this.isValid = isValid;
    this.createdAt = createdAt;
    this.signer = signer;
  }

  @ApiProperty({ description: 'Unique signature identifier' })
  id!: string;

  @ApiProperty({
    enum: SignatureType,
    description: 'Type of signature applied'
  })
  type!: SignatureType;

  @ApiProperty({ description: 'Certificate ID used for this signature' })
  certificateId!: string;

  @ApiProperty({ description: 'Whether the signature is valid' })
  isValid!: boolean;

  @ApiProperty({ description: 'Signature creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'User who created this signature' })
  signer!: UserDto;
}

export class DocumentDto {
  constructor(
    id: string,
    title: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    fileHash: string,
    status: DocumentStatus,
    createdAt: Date,
    updatedAt: Date,
    owner: UserDto,
    signatures: SignatureDto[],
    description?: string,
    expiresAt?: Date,
  ) {
    this.id = id;
    this.title = title;
    this.fileName = fileName;
    this.originalName = originalName;
    this.mimeType = mimeType;
    this.fileSize = fileSize;
    this.fileHash = fileHash;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.owner = owner;
    this.signatures = signatures;
    this.description = description;
    this.expiresAt = expiresAt;
  }
  @ApiProperty({ description: 'Unique document identifier' })
  id: string;

  @ApiProperty({ description: 'Document title' })
  title: string;

  @ApiProperty({ description: 'Document description' })
  description?: string;

  @ApiProperty({ description: 'System generated filename' })
  fileName: string;

  @ApiProperty({ description: 'Original uploaded filename' })
  originalName: string;

  @ApiProperty({ description: 'MIME type of the document' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'SHA-256 hash of the file' })
  fileHash: string;

  @ApiProperty({ 
    enum: DocumentStatus,
    description: 'Current status of the document'
  })
  status: DocumentStatus;

  @ApiProperty({ description: 'Document expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Document creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Document owner' })
  owner: UserDto;

  @ApiProperty({ 
    type: [SignatureDto],
    description: 'List of signatures applied to this document'
  })
  signatures: SignatureDto[];

  @ApiProperty({
    required: false,
    description: 'Workflow, participants, etc.',
  })
  metadata?: DocumentMetadata;

  @ApiProperty({
    required: false,
    description: 'Résumé du flux de signature pour l’interface',
  })
  workflowSummary?: {
    mode: 'sequential' | 'parallel';
    stepsTotal: number;
    signaturesCompleted: number;
  };

  @ApiProperty({
    required: false,
    description: "True si l'utilisateur courant peut signer maintenant (renseigné côté API).",
  })
  maySign?: boolean;
}