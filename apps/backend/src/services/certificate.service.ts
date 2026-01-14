// src/services/certificate.service.ts
import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';

@Injectable()
export class CertificateService {
  async getCertificateChain(certificateId: string): Promise<string[]> {
    // Récupération de la chaîne complète depuis la PKI
    // Root CA -> Intermediate CA -> End Entity Certificate
    return [
      'end-entity-cert-pem',
      'intermediate-ca-cert-pem',
      'root-ca-cert-pem',
    ];
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
