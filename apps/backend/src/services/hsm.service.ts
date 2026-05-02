// src/services/hsm.service.ts
import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';

/**
 * Simulation HSM : pour le développement, on génère une vraie paire RSA + certificat
 * auto-signé par identifiant de certificat (stable en mémoire pour ce processus).
 * Les anciens placeholders « ... » n’étaient pas du PEM valide → erreur forge « Invalid PEM ».
 */
@Injectable()
export class HSMService {
  private readonly pairs = new Map<
    string,
    { privateKeyPem: string; certificatePem: string }
  >();

  async fetchPrivateKey(certificateId: string): Promise<string> {
    return this.getOrCreateDevPair(certificateId).privateKeyPem;
  }

  async fetchCertificate(certificateId: string): Promise<string> {
    return this.getOrCreateDevPair(certificateId).certificatePem;
  }

  async fetchFromHSM(key: string): Promise<string> {
    if (key.includes('private-key')) {
      return this.fetchPrivateKey(key.replace('private-key-', ''));
    }
    return this.fetchCertificate(key.replace('certificate-', ''));
  }

  private getOrCreateDevPair(certificateId: string): {
    privateKeyPem: string;
    certificatePem: string;
  } {
    let pair = this.pairs.get(certificateId);
    if (pair) {
      return pair;
    }

    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    const cn = `esign-dev-${certificateId.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 48)}`;
    const attrs = [
      { name: 'commonName', value: cn },
      { name: 'organizationName', value: 'E-Sign Platform (dev)' },
      { name: 'countryName', value: 'FR' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
        nonRepudiation: true,
      },
    ]);

    cert.sign(keys.privateKey, forge.md.sha256.create());

    pair = {
      privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
      certificatePem: forge.pki.certificateToPem(cert),
    };
    this.pairs.set(certificateId, pair);
    return pair;
  }
}
