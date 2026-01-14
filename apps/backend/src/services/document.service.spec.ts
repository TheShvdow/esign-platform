// src/services/document.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DocumentService } from './document.service';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { DocumentStatus, UserRole } from '../types/global.types';
import { CryptographyService } from './cryptography.service';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';
import { FileValidationService } from './file-validation.service';
import { DocumentMapperService } from './document-mapper.service';
import { PermissionService } from './permission.service';
import { SignatureCreationService } from './signature-creation.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let documentRepository: Repository<Document>;
  let cryptographyService: CryptographyService;
  let storageService: StorageService;
  let auditService: AuditService;
  let eventEmitter: EventEmitter2;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hasRole: jest.fn().mockReturnValue(false),
  } as User;

  const mockDocument: Document = {
    id: 'doc-1',
    title: 'Test Document',
    fileName: 'test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    fileHash: 'hash123',
    storageKey: 'storage-key-1',
    status: DocumentStatus.PENDING_SIGNATURE,
    ownerId: 'user-1',
    owner: mockUser,
    signatures: [],
    canBeSignedBy: jest.fn().mockReturnValue(true),
    isExpired: jest.fn().mockReturnValue(false),
    validateForSigning: jest.fn().mockReturnValue([]),
    updateStatusBasedOnSignatures: jest.fn(),
    getSignatureProgress: jest.fn().mockReturnValue(0),
    getCurrentSignatureCount: jest.fn().mockReturnValue(0),
    getRequiredSignatures: jest.fn().mockReturnValue(1),
  } as Document;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn().mockResolvedValue(undefined),
              startTransaction: jest.fn().mockResolvedValue(undefined),
              commitTransaction: jest.fn().mockResolvedValue(undefined),
              rollbackTransaction: jest.fn().mockResolvedValue(undefined),
              release: jest.fn().mockResolvedValue(undefined),
              manager: {
                create: jest.fn(),
                save: jest.fn(),
              },
            })),
          },
        },
        {
          provide: CryptographyService,
          useValue: {
            generateHash: jest.fn().mockResolvedValue('hash123'),
            signData: jest.fn().mockResolvedValue({
              signature: 'signature123',
              evidence: {
                hash: 'hash123',
                algorithm: 'sha256',
                timestamp: new Date(),
                certificateChain: ['cert1'],
              },
            }),
            verifySignature: jest.fn().mockResolvedValue({
              isValid: true,
            }),
          },
        },
        {
          provide: StorageService,
          useValue: {
            store: jest.fn().mockResolvedValue('storage-key-1'),
            retrieve: jest.fn().mockResolvedValue(Buffer.from('file content')),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: FileValidationService,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: DocumentMapperService,
          useValue: {
            toDto: jest.fn().mockReturnValue({
              id: 'doc-1',
              title: 'Test Document',
            }),
            toDtoList: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            checkDocumentAccess: jest.fn(),
          },
        },
        {
          provide: SignatureCreationService,
          useValue: {
            createInTransaction: jest.fn().mockResolvedValue({
              id: 'sig-1',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    documentRepository = module.get<Repository<Document>>(getRepositoryToken(Document));
    cryptographyService = module.get<CryptographyService>(CryptographyService);
    storageService = module.get<StorageService>(StorageService);
    auditService = module.get<AuditService>(AuditService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a document successfully', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      const createDto = {
        title: 'Test Document',
        description: 'Test Description',
      };

      jest.spyOn(documentRepository, 'create').mockReturnValue(mockDocument);
      jest.spyOn(documentRepository, 'save').mockResolvedValue(mockDocument);

      const result = await service.create(createDto, file, mockUser);

      expect(result).toBeDefined();
      expect(storageService.store).toHaveBeenCalled();
      expect(cryptographyService.generateHash).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('document.created', expect.any(Object));
    });
  });

  describe('findById', () => {
    it('should find document by id', async () => {
      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(mockDocument);

      const result = await service.findById('doc-1', mockUser);

      expect(result).toBeDefined();
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        relations: ['owner', 'signatures', 'signatures.signer'],
      });
    });

    it('should throw NotFoundException for non-existent document', async () => {
      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findById('non-existent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('signDocument', () => {
    it('should sign document successfully', async () => {
      const signDto = {
        signatureType: 'ADVANCED' as any,
        certificateId: 'cert-123',
      };

      jest.spyOn(documentRepository, 'findOne')
        .mockResolvedValueOnce(mockDocument) // First call for loading
        .mockResolvedValueOnce(mockDocument); // Second call after transaction

      const result = await service.signDocument('doc-1', signDto, mockUser, {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' },
      } as any);

      expect(result).toBeDefined();
      expect(cryptographyService.signData).toHaveBeenCalled();
    });

    it('should throw BadRequestException if document cannot be signed', async () => {
      const document = {
        ...mockDocument,
        canBeSignedBy: jest.fn().mockReturnValue(false),
      };

      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(document);

      await expect(
        service.signDocument('doc-1', {
          signatureType: 'ADVANCED' as any,
          certificateId: 'cert-123',
        }, mockUser, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyDocument', () => {
    it('should verify document successfully', async () => {
      const document = {
        ...mockDocument,
        signatures: [
          {
            id: 'sig-1',
            signatureValue: 'signature123',
            certificatePem: 'cert-pem',
          },
        ],
      };

      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(document);

      const result = await service.verifyDocument('doc-1', mockUser);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.signatures).toBeDefined();
    });

    it('should return isValid false for document without signatures', async () => {
      jest.spyOn(documentRepository, 'findOne').mockResolvedValue(mockDocument);

      const result = await service.verifyDocument('doc-1', mockUser);

      expect(result.isValid).toBe(false);
      expect(result.signatures).toEqual([]);
    });
  });
});
