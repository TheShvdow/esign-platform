// src/dto/document.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsDate, 
  IsEnum,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus, SignatureType } from '../types/global.types';
import { UserDto } from './auth.dto';

export class CreateDocumentDto {
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
    description: 'Additional metadata for the document',
    example: { requiredSignatures: 2, department: 'legal' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SignDocumentDto {
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
  additionalMetadata?: Record<string, any>;
}

export class SignatureDto {
  @ApiProperty({ description: 'Unique signature identifier' })
  id: string;

  @ApiProperty({ 
    enum: SignatureType,
    description: 'Type of signature applied'
  })
  type: SignatureType;

  @ApiProperty({ description: 'Certificate ID used for this signature' })
  certificateId: string;

  @ApiProperty({ description: 'Whether the signature is valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Signature creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'User who created this signature' })
  signer: UserDto;
}

export class DocumentDto {
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
}