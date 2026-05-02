// src/services/document.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { Signature } from '../entities/signature.entity';
import { User } from '../entities/user.entity';
import {
  CreateDocumentDto,
  DocumentDto,
  SignDocumentDto,
} from '../dto/document.dto';
import { DocumentStatus, UserRole, AuditAction, AuthenticatedRequest, DocumentVerificationResult } from '../types/global.types';
import { CryptographyService, SignatureResult } from './cryptography.service';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FileValidationService } from './file-validation.service';
import { DocumentMapperService } from './document-mapper.service';
import { PermissionService } from './permission.service';
import { SignatureCreationService } from './signature-creation.service';
import { SignedPdfAnnexService } from './signed-pdf-annex.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private dataSource: DataSource,
    private cryptographyService: CryptographyService,
    private storageService: StorageService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
    private fileValidationService: FileValidationService,
    private documentMapper: DocumentMapperService,
    private permissionService: PermissionService,
    private signatureCreationService: SignatureCreationService,
    private signedPdfAnnexService: SignedPdfAnnexService,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<DocumentDto> {
    this.fileValidationService.validate(file);

    const fileHash = await this.cryptographyService.generateHash(file.buffer);
    const storageKey = await this.storageService.store(file.buffer, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      ownerId: user.id,
    });

    const document = this.documentRepository.create({
      ...createDocumentDto,
      fileName: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey,
      fileHash,
      hashAlgorithm: 'sha256',
      ownerId: user.id,
      status: DocumentStatus.PENDING_SIGNATURE,
    });

    const savedDocument = await this.documentRepository.save(document);

    const documentWithRelations = await this.documentRepository.findOne({
      where: { id: savedDocument.id },
      relations: ['owner', 'signatures', 'signatures.signer'],
    });
    if (!documentWithRelations) {
      throw new NotFoundException('Document could not be loaded after upload');
    }

    await this.auditService.log({
      action: AuditAction.DOCUMENT_UPLOAD,
      userId: user.id,
      entityType: 'Document',
      entityId: savedDocument.id,
      details: {
        fileName: file.originalname,
        fileSize: file.size,
        fileHash,
      },
    });

    this.eventEmitter.emit('document.created', {
      document: documentWithRelations,
      user,
    });

    return this.documentMapper.toDto(documentWithRelations, user);
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    documents: DocumentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.owner', 'owner')
      .leftJoinAndSelect('document.signatures', 'signatures')
      .leftJoinAndSelect('signatures.signer', 'signer');

    if (!user.hasRole(UserRole.ADMIN)) {
      query.where('document.ownerId = :userId', { userId: user.id });
    }

    const [documents, total] = await query
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      documents: this.documentMapper.toDtoList(documents, user),
      total,
      page,
      limit,
    };
  }

  async getDownloadFile(
    id: string,
    user: User,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['signatures', 'signatures.signer', 'owner'],
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    this.permissionService.checkDocumentAccess(document, user);
    let buffer = await this.retrieveFile(document.storageKey, id);
    buffer = await this.signedPdfAnnexService.embedAnnexForSignedPdf(
      buffer,
      document,
    );
    return {
      buffer,
      fileName: document.originalName,
      mimeType: document.mimeType,
    };
  }

  async findById(id: string, user: User): Promise<DocumentDto> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner', 'signatures', 'signatures.signer'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.permissionService.checkDocumentAccess(document, user);
    return this.documentMapper.toDto(document, user);
  }

  async signDocument(
    documentId: string,
    signDto: SignDocumentDto,
    user: User,
    request: AuthenticatedRequest,
  ): Promise<DocumentDto> {
    const document = await this.loadDocumentForSigning(documentId);
    this.validateDocumentForSigning(document, user);

    const fileBuffer = await this.retrieveFile(document.storageKey, documentId);
    const signatureResult = await this.createSignature(fileBuffer, signDto);

    // ✅ Bug 2 Fix: Vérifier la signature immédiatement après création
    const certificatePem =
      (signatureResult.evidence?.certificateChain &&
        signatureResult.evidence.certificateChain[0]) ||
      '';

    const verificationResult = await this.cryptographyService.verifySignature(
      signatureResult.signature,
      fileBuffer,
      certificatePem,
    );

    const isValid = verificationResult.isValid;
    const validationErrors = verificationResult.errors
      ? verificationResult.errors.join('; ')
      : null;

    const updatedDocument = await this.saveSignatureInTransaction(
      document,
      user,
      signDto,
      signatureResult,
      request,
      isValid,
      validationErrors,
    );

    await this.logSignatureAudit(updatedDocument, user, signDto);
    this.emitSignatureEvent(updatedDocument, user);

    return this.documentMapper.toDto(updatedDocument, user);
  }

  async verifyDocument(
    documentId: string,
    user: User,
  ): Promise<DocumentVerificationResult> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['signatures'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.permissionService.checkDocumentAccess(document, user);

    const originalFile = await this.retrieveFile(document.storageKey, documentId);
    this.verifyFileIntegrity(originalFile, document);

    if (!document.signatures || document.signatures.length === 0) {
      return { isValid: false, signatures: [] };
    }

    const signatureVerifications = await this.verifyAllSignatures(
      document.signatures,
      originalFile,
    );

    const isValid = signatureVerifications.every((v) => v.isValid);

    await this.auditService.log({
      action: AuditAction.DOCUMENT_VERIFY,
      userId: user.id,
      entityType: 'Document',
      entityId: document.id,
      details: {
        isValid,
        signatureCount: document.getCurrentSignatureCount(),
        requiredSignatures: document.getRequiredSignatures(),
      },
    });

    return { isValid, signatures: signatureVerifications };
  }

  private async loadDocumentForSigning(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['signatures', 'signatures.signer'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private validateDocumentForSigning(document: Document, user: User): void {
    if (!document.canBeSignedBy(user)) {
      throw new BadRequestException('Document cannot be signed by this user');
    }

    if (document.isExpired()) {
      throw new BadRequestException('Document has expired');
    }

    const validationErrors = document.validateForSigning();
    if (validationErrors.length > 0) {
      throw new BadRequestException(`Cannot sign document: ${validationErrors.join(', ')}`);
    }
  }

  private async retrieveFile(storageKey: string, documentId: string): Promise<Buffer> {
    try {
      return await this.storageService.retrieve(storageKey);
    } catch (error) {
      throw new NotFoundException(
        `File not found for document ${documentId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private async createSignature(
    fileBuffer: Buffer,
    signDto: SignDocumentDto,
  ): Promise<SignatureResult> {
    try {
      return await this.cryptographyService.signData({
        data: fileBuffer,
        certificateId: signDto.certificateId,
        signatureType: signDto.signatureType,
      });
    } catch (error: unknown) {
      throw new BadRequestException(`Failed to sign document: ${this.getErrorMessage(error)}`);
    }
  }

  private async saveSignatureInTransaction(
    document: Document,
    user: User,
    signDto: SignDocumentDto,
    signatureResult: SignatureResult,
    request: AuthenticatedRequest,
    isValid: boolean,
    validationErrors: string | null,
  ): Promise<Document> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newSignature = await this.signatureCreationService.createInTransaction(
        queryRunner,
        document,
        user,
        signDto,
        signatureResult,
        request,
        isValid,
        validationErrors,
      );

      if (!document.signatures) {
        document.signatures = [];
      }
      document.signatures.push(newSignature);
      document.updateStatusBasedOnSignatures();
      await queryRunner.manager.save(Document, document);
      await queryRunner.commitTransaction();

      const updatedDocument = await this.documentRepository.findOne({
        where: { id: document.id },
        relations: ['owner', 'signatures', 'signatures.signer'],
      });
      if (!updatedDocument) {
        throw new NotFoundException(`Signed document ${document.id} could not be reloaded`);
      }
      return updatedDocument;
    } catch (error){
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Failed to save signature: ${this.getErrorMessage(error)}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async verifyFileIntegrity(fileBuffer: Buffer, document: Document): Promise<void> {
    const currentHash = await this.cryptographyService.generateHash(fileBuffer);
    if (currentHash !== document.fileHash) {
      throw new BadRequestException('Document integrity compromised');
    }
  }

  private async verifyAllSignatures(
    signatures: Signature[],
    originalFile: Buffer,
  ): Promise<Array<{ signatureId: string; isValid: boolean; errors?: string[] }>> {
    return Promise.all(
      signatures.map(async (signature) => {
        try {
          const verification = await this.cryptographyService.verifySignature(
            signature.signatureValue,
            originalFile,
            signature.certificatePem,
          );

          return {
            signatureId: signature.id,
            isValid: verification.isValid,
            errors: verification.errors,
          };
        } catch (error) {
          return {
            signatureId: signature.id,
            isValid: false,
            errors: [`Verification error: ${this.getErrorMessage(error)}`],
          };
        }
      }),
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unexpected error';
  }

  private async logSignatureAudit(
    document: Document,
    user: User,
    signDto: SignDocumentDto,
  ): Promise<void> {
    await this.auditService.log({
      action: AuditAction.DOCUMENT_SIGN,
      userId: user.id,
      entityType: 'Document',
      entityId: document.id,
      details: {
        signatureType: signDto.signatureType,
        certificateId: signDto.certificateId,
        signatureProgress: document.getSignatureProgress(),
      },
    });
  }

  private emitSignatureEvent(document: Document, user: User): void {
    this.eventEmitter.emit('document.signed', {
      document,
      user,
    });
  }
}
