// src/services/document-mapper.service.ts
import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { DocumentDto } from '../dto/document.dto';

@Injectable()
export class DocumentMapperService {
  toDto(document: Document): DocumentDto {
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      originalName: document.originalName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      fileHash: document.fileHash,
      status: document.status,
      expiresAt: document.expiresAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      owner: {
        id: document.owner.id,
        email: document.owner.email,
        firstName: document.owner.firstName,
        lastName: document.owner.lastName,
        role: document.owner.role,
        isActive: document.owner.isActive,
        emailVerified: document.owner.emailVerified,
        mfaEnabled: document.owner.mfaEnabled,
        createdAt: document.owner.createdAt,
      },
      signatures:
        document.signatures?.map((sig) => ({
          id: sig.id,
          type: sig.type,
          certificateId: sig.certificateId,
          isValid: sig.isValid,
          createdAt: sig.createdAt,
          signer: {
            id: sig.signer.id,
            email: sig.signer.email,
            firstName: sig.signer.firstName,
            lastName: sig.signer.lastName,
            role: sig.signer.role,
            isActive: sig.signer.isActive,
            emailVerified: sig.signer.emailVerified,
            mfaEnabled: sig.signer.mfaEnabled,
            createdAt: sig.signer.createdAt,
          },
        })) || [],
    };
  }

  toDtoList(documents: Document[]): DocumentDto[] {
    return documents.map((doc) => this.toDto(doc));
  }
}
