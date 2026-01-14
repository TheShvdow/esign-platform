// src/services/signature-creation.service.ts
import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Signature } from '../entities/signature.entity';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { SignDocumentDto } from '../dto/document.dto';
import { AuthenticatedRequest, SignatureMetadata } from '../types/global.types';
import { SignatureResult } from './cryptography.service';

@Injectable()
export class SignatureCreationService {
  createInTransaction(
    queryRunner: QueryRunner,
    document: Document,
    user: User,
    signDto: SignDocumentDto,
    signatureResult: SignatureResult,
    request: AuthenticatedRequest,
    isValid: boolean = false,
    validationErrors: string | null = null,
  ): Promise<Signature> {
    // ✅ Bug 1 Fix: Assurer que signedAt est toujours inclus
    const metadata: SignatureMetadata = {
      ...(signDto.additionalMetadata || {}),
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers?.['user-agent'] || 'unknown',
      signedAt: new Date(), // ✅ Toujours inclure signedAt
    };

    const certificatePem =
      (signatureResult.evidence?.certificateChain &&
        signatureResult.evidence.certificateChain[0]) ||
      '';

    // ✅ Bug 2 Fix: isValid doit être déterminé par vérification réelle, pas hardcodé
    const signature = queryRunner.manager.create(Signature, {
      documentId: document.id,
      signerId: user.id,
      type: signDto.signatureType,
      signatureValue: signatureResult.signature,
      metadata,
      cryptographicEvidence: signatureResult.evidence,
      certificateId: signDto.certificateId,
      certificatePem,
      tsaResponse: signatureResult.evidence?.tsaResponse,
      isValid, // ✅ Utiliser la valeur vérifiée au lieu de hardcoder true
      validationErrors, // ✅ Inclure les erreurs de validation si présentes
    });

    return queryRunner.manager.save(Signature, signature);
  }

  create(
    document: Document,
    user: User,
    signDto: SignDocumentDto,
    signatureResult: SignatureResult,
    request: AuthenticatedRequest,
    signatureRepository: any,
    isValid: boolean = false,
    validationErrors: string | null = null,
  ): Promise<Signature> {
    // ✅ Bug 1 Fix: Assurer que signedAt est toujours inclus
    const metadata: SignatureMetadata = {
      ...(signDto.additionalMetadata || {}),
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers?.['user-agent'] || 'unknown',
      signedAt: new Date(), // ✅ Toujours inclure signedAt
    };

    const certificatePem =
      (signatureResult.evidence?.certificateChain &&
        signatureResult.evidence.certificateChain[0]) ||
      '';

    // ✅ Bug 2 Fix: isValid doit être déterminé par vérification réelle, pas hardcodé
    const signature = signatureRepository.create({
      documentId: document.id,
      signerId: user.id,
      type: signDto.signatureType,
      signatureValue: signatureResult.signature,
      metadata,
      cryptographicEvidence: signatureResult.evidence,
      certificateId: signDto.certificateId,
      certificatePem,
      tsaResponse: signatureResult.evidence?.tsaResponse,
      isValid, // ✅ Utiliser la valeur vérifiée au lieu de hardcoder true
      validationErrors, // ✅ Inclure les erreurs de validation si présentes
    });

    return signatureRepository.save(signature);
  }
}
