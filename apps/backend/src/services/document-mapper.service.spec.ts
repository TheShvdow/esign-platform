// src/services/document-mapper.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentMapperService } from './document-mapper.service';
import { Document } from '../entities/document.entity';
import { DocumentStatus } from '../types/global.types';

describe('DocumentMapperService', () => {
  let service: DocumentMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentMapperService],
    }).compile();

    service = module.get<DocumentMapperService>(DocumentMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toDto', () => {
    it('should map Document to DocumentDto correctly', () => {
      const document = {
        id: 'doc-1',
        title: 'Test Document',
        description: 'Test Description',
        fileName: 'test.pdf',
        originalName: 'original.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        fileHash: 'hash123',
        status: DocumentStatus.PENDING_SIGNATURE,
        expiresAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        owner: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER' as any,
          isActive: true,
          emailVerified: true,
          mfaEnabled: false,
          createdAt: new Date('2024-01-01'),
        },
        signatures: [],
      } as Document;

      const dto = service.toDto(document);

      expect(dto.id).toBe('doc-1');
      expect(dto.title).toBe('Test Document');
      expect(dto.owner.id).toBe('user-1');
      expect(dto.owner.email).toBe('test@example.com');
      expect(dto.signatures).toEqual([]);
    });

    it('should map signatures correctly', () => {
      const document = {
        id: 'doc-1',
        title: 'Test Document',
        fileName: 'test.pdf',
        originalName: 'original.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        fileHash: 'hash123',
        status: DocumentStatus.PENDING_SIGNATURE,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER' as any,
          isActive: true,
          emailVerified: true,
          mfaEnabled: false,
          createdAt: new Date(),
        },
        signatures: [
          {
            id: 'sig-1',
            type: 'ADVANCED' as any,
            certificateId: 'cert-1',
            isValid: true,
            createdAt: new Date(),
            signer: {
              id: 'user-2',
              email: 'signer@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              role: 'USER' as any,
              isActive: true,
              emailVerified: true,
              mfaEnabled: false,
              createdAt: new Date(),
            },
          },
        ],
      } as Document;

      const dto = service.toDto(document);

      expect(dto.signatures).toHaveLength(1);
      expect(dto.signatures[0].id).toBe('sig-1');
      expect(dto.signatures[0].signer.email).toBe('signer@example.com');
    });
  });

  describe('toDtoList', () => {
    it('should map array of documents to DTOs', () => {
      const documents = [
        {
          id: 'doc-1',
          title: 'Document 1',
          fileName: 'doc1.pdf',
          originalName: 'doc1.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          fileHash: 'hash1',
          status: DocumentStatus.PENDING_SIGNATURE,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER' as any,
            isActive: true,
            emailVerified: true,
            mfaEnabled: false,
            createdAt: new Date(),
          },
          signatures: [],
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          fileName: 'doc2.pdf',
          originalName: 'doc2.pdf',
          mimeType: 'application/pdf',
          fileSize: 2048,
          fileHash: 'hash2',
          status: DocumentStatus.FULLY_SIGNED,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER' as any,
            isActive: true,
            emailVerified: true,
            mfaEnabled: false,
            createdAt: new Date(),
          },
          signatures: [],
        },
      ] as Document[];

      const dtos = service.toDtoList(documents);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('doc-1');
      expect(dtos[1].id).toBe('doc-2');
    });
  });
});
