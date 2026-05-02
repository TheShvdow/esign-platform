// src/services/certificate.service.ts
import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { HSMService } from './hsm.service';

@Injectable()
export class CertificateService {
  constructor(private readonly hsmService: HSMService) {}

  async getCertificateChain(certificateId: string): Promise<string[]> {
    const pem = await this.hsmService.fetchCertificate(certificateId);
    return [pem];
  }

  isCertificateValid(certificate: forge.pki.Certificate): boolean {
    const now = new Date();
    return (
      now >= certificate.validity.notBefore &&
      now <= certificate.validity.notAfter
    );
  }

  async verifyCertificateChain(certificate: forge.pki.Certificate): Promise<boolean> {
    // Vérification de la chaîne de certification complète
    // En production, vérifier contre les CA de confiance
    return true; // Simulation
  }
}
