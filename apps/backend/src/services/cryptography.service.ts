// src/services/cryptography.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { SignatureType, SigningOptions } from '../types/global.types';
import { HSMService } from './hsm.service';
import { CertificateService } from './certificate.service';
import { TSAService } from './tsa.service';

export interface SignatureRequest {
  data: Buffer;
  certificateId: string;
  signatureType: SignatureType;
}

export interface SignatureResult {
  signature: string;
  evidence: any;
}

@Injectable()
export class CryptographyService {
  constructor(
    private hsmService: HSMService,
    private certificateService: CertificateService,
    private tsaService: TSAService,
  ) {}

  async generateHash(
    data: Buffer,
    algorithm: string = 'sha256',
  ): Promise<string> {
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    return hash.digest('hex');
  }

  async signData(request: SignatureRequest): Promise<SignatureResult> {
    const { data, certificateId, signatureType } = request;

    const hash = await this.generateHash(data);
    const privateKeyPem = await this.hsmService.fetchPrivateKey(certificateId);
    const certificatePem = await this.hsmService.fetchCertificate(certificateId);

    const forgeBuffer = forge.util.createBuffer(data.toString('binary'));
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forgeBuffer;

    const signingOptions = this.getSigningOptions(signatureType);
    const certificate = forge.pki.certificateFromPem(certificatePem);
    p7.addCertificate(certificate);
    
    p7.addSigner({
      key: privateKeyPem,
      certificate: certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: signingOptions.authenticatedAttributes,
    });

    p7.sign();
    
    const p7Asn1 = p7.toAsn1();
    const signature = forge.util.encode64(forge.asn1.toDer(p7Asn1).getBytes());

    const evidence: any = {
      hash,
      algorithm: 'sha256',
      timestamp: new Date(),
      certificateChain: await this.certificateService.getCertificateChain(certificateId),
    };

    if (signatureType === SignatureType.QUALIFIED) {
      evidence.tsaResponse = await this.tsaService.requestTimestamp(hash);
    }

    return { signature, evidence };
  }

  async verifySignature(
    signature: string,
    originalData: Buffer,
    certificatePem: string,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    try {
      const signatureBytes = forge.util.decode64(signature);
      const p7 = forge.pkcs7.messageFromAsn1(
        forge.asn1.fromDer(signatureBytes),
      ) as forge.pkcs7.PkcsSignedData;

      const certificate = forge.pki.certificateFromPem(certificatePem);
      const forgeBuffer = forge.util.createBuffer(originalData.toString('binary'));

      let verified = false;
      try {
        if (p7.certificates && p7.certificates.length > 0) {
          const certificateMatches = p7.certificates.some((cert: any) => {
            try {
              const certPem = forge.pki.certificateToPem(cert);
              return certPem === certificatePem;
            } catch {
              return false;
            }
          });
          verified = certificateMatches;
        }
      } catch (error) {
        verified = false;
      }

      if (!verified) {
        return { isValid: false, errors: ['Signature verification failed'] };
      }

      const errors: string[] = [];

      if (!this.certificateService.isCertificateValid(certificate)) {
        errors.push('Certificate is not valid');
      }

      const chainValid = await this.certificateService.verifyCertificateChain(certificate);
      if (!chainValid) {
        errors.push('Certificate chain is not valid');
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Verification error: ${error.message}`],
      };
    }
  }

  private getSigningOptions(signatureType: SignatureType): SigningOptions {
    const signingTime = new Date().toISOString();
    
    const baseAttributes = [
      {
        type: forge.pki.oids.contentTypes,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: signingTime,
      },
    ];

    switch (signatureType) {
      case SignatureType.QUALIFIED:
        return {
          authenticatedAttributes: [
            ...baseAttributes,
            {
              type: '1.2.840.113549.1.9.16.2.47',
              value: 'qualified-signature-attributes',
            },
          ],
        };
      case SignatureType.ADVANCED:
        return {
          authenticatedAttributes: [
            ...baseAttributes,
            {
              type: '1.2.840.113549.1.9.16.2.12',
              value: 'advanced-signature-attributes',
            },
          ],
        };
      default:
        return {
          authenticatedAttributes: baseAttributes,
        };
    }
  }
}
