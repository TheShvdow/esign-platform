// src/services/document.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import {
  CreateDocumentDto,
  DocumentDto,
  SignDocumentDto,
} from '../dto/document.dto';
import { DocumentStatus, UserRole, AuditAction } from '../types/global.types';
import { CryptographyService } from './cryptography.service';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private cryptographyService: CryptographyService,
    private storageService: StorageService,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<DocumentDto> {
    // Validation du fichier
    this.validateFile(file);

    // Calcul du hash du fichier
    const fileHash = await this.cryptographyService.generateHash(file.buffer);

    // Stockage sécurisé du fichier
    const storageKey = await this.storageService.store(file.buffer, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      ownerId: user.id,
    });

    // Création de l'entité document
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

    // Audit log
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

    // Événement pour notifications
    this.eventEmitter.emit('document.created', {
      document: savedDocument,
      user,
    });

    return this.toDto(savedDocument);
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

    // Filtrage selon le rôle
    if (!user.hasRole(UserRole.ADMIN)) {
      query.where('document.ownerId = :userId', { userId: user.id });
    }

    const [documents, total] = await query
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      documents: documents.map((doc) => this.toDto(doc)),
      total,
      page,
      limit,
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

    // Vérification des permissions
    this.checkPermissions(document, user);

    return this.toDto(document);
  }

  async signDocument(
    documentId: string,
    signDto: SignDocumentDto,
    user: User,
    request: any,
  ): Promise<DocumentDto> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['signatures'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Vérifications préalables avec les méthodes de l'entité
    if (!document.canBeSignedBy(user.id)) {
      throw new BadRequestException('Document cannot be signed by this user');
    }

    if (document.isExpired()) {
      throw new BadRequestException('Document has expired');
    }

    // Vérifications supplémentaires avec les méthodes de l'entité
    const validationErrors = document.validateForSigning();
    if (validationErrors.length > 0) {
      throw new BadRequestException(`Cannot sign document: ${validationErrors.join(', ')}`);
    }

    // Récupération du fichier depuis le stockage
    const fileBuffer = await this.storageService.retrieve(document.storageKey);

    // Signature cryptographique
    const signatureResult = await this.cryptographyService.signData({
      data: fileBuffer,
      certificateId: signDto.certificateId,
      signatureType: signDto.signatureType,
    });

    // Création de la signature en base
    const signature = await this.createSignatureRecord(
      document,
      user,
      signDto,
      signatureResult,
      request,
    );

    // Mise à jour du statut du document avec les méthodes de l'entité
    document.updateStatusBasedOnSignatures();
    await this.documentRepository.save(document);

    // Audit log
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

    // Notifications
    this.eventEmitter.emit('document.signed', {
      document,
      signature,
      user,
    });

    return this.findById(documentId, user);
  }

  async verifyDocument(
    documentId: string,
    user: User,
  ): Promise<{
    isValid: boolean;
    signatures: Array<{
      signatureId: string;
      isValid: boolean;
      errors?: string[];
    }>;
  }> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['signatures'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.checkPermissions(document, user);

    // Récupération du fichier original
    const originalFile = await this.storageService.retrieve(
      document.storageKey,
    );

    // Vérification de l'intégrité du fichier
    const currentHash =
      await this.cryptographyService.generateHash(originalFile);
    if (currentHash !== document.fileHash) {
      throw new BadRequestException('Document integrity compromised');
    }

    // Vérification de chaque signature
    const signatureVerifications = await Promise.all(
      document.signatures.map(async (signature) => {
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
      }),
    );

    const isValid = signatureVerifications.every((v) => v.isValid);

    // Audit log
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

    return {
      isValid,
      signatures: signatureVerifications,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds limit');
    }
  }

  private checkPermissions(document: Document, user: User): void {
    if (document.ownerId !== user.id && !user.hasRole(UserRole.ADMIN)) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async createSignatureRecord(
    document: Document,
    user: User,
    signDto: SignDocumentDto,
    signatureResult: any,
    request: any,
  ) {
    // Implémentation création signature en base - à compléter selon votre entité Signature
    const signature = {
      documentId: document.id,
      signerId: user.id,
      signatureType: signDto.signatureType,
      certificateId: signDto.certificateId,
      signatureValue: signatureResult.signature,
      evidence: signatureResult.evidence,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      createdAt: new Date(),
    };
    
    // Sauvegarder en base avec votre repository Signature
    // return await this.signatureRepository.save(signature);
    
    return signature; // Retour temporaire pour la compilation
  }

  private toDto(document: Document): DocumentDto {
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
}