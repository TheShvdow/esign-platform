// src/services/signature-creation.service.ts
import { Injectable } from '@nestjs/common';
import { QueryRunner, Repository } from 'typeorm';
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
    validationErrors: string | null,
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

    // Relations `document` / `signer` (pas seulement les IDs) : avec @JoinColumn sur la même
    // colonne qu’un @Column explicite, TypeORM peut insérer NULL pour documentId si on ne passe que l’ID.
    const signatureData: Partial<Signature> & {
      validationErrors?: string | null;
    } = {
      document,
      signer: user,
      type: signDto.signatureType,
      signatureValue: signatureResult.signature,
      metadata,
      cryptographicEvidence: signatureResult.evidence,
      certificateId: signDto.certificateId,
      certificatePem,
      tsaResponse: signatureResult.evidence?.tsaResponse,
      isValid,
    };

    if (validationErrors !== undefined) {
      signatureData.validationErrors = validationErrors ?? undefined;
    }

    const signature = queryRunner.manager.create(Signature, signatureData);

    return queryRunner.manager.save(Signature, signature);
  }

  create(
    document: Document,
    user: User,
    signDto: SignDocumentDto,
    signatureResult: SignatureResult,
    request: AuthenticatedRequest,
    signatureRepository: Repository<Signature>,
    isValid: boolean = false,
    validationErrors?: string,
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
      document,
      signer: user,
      type: signDto.signatureType,
      signatureValue: signatureResult.signature,
      metadata,
      cryptographicEvidence: signatureResult.evidence,
      certificateId: signDto.certificateId,
      certificatePem,
      tsaResponse: signatureResult.evidence?.tsaResponse,
      isValid,
      validationErrors,
    });

    return signatureRepository.save(signature);
  }
}
