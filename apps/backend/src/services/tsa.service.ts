// src/services/tsa.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

@Injectable()
export class TSAService {
  constructor(private configService: ConfigService) {}

  async requestTimestamp(hash: string): Promise<string> {
    try {
      // En production, utiliser une vraie TSA RFC 3161
      // const tsQuery = this.createCustomTimeStampQuery(hash);

      // Simulation - remplacer par vraie requête HTTP vers TSA
      const tsResponse = 'simulated-tsa-response-' + hash;

      return forge.util.encode64(tsResponse);
    } catch (error) {
      console.warn('TSA request failed, using local timestamp:', error.message);
      return forge.util.encode64(`local-timestamp-${Date.now()}-${hash}`);
    }
  }

  private createCustomTimeStampQuery(hash: string): any {
    // Implémentation personnalisée d'une requête TSA
    // En attendant que node-forge supporte createTimeStampQuery
    return {
      messageImprint: {
        hashAlgorithm: 'sha256',
        hashedMessage: hash,
      },
      reqPolicy: undefined,
      nonce: forge.util.encode64(crypto.randomBytes(16).toString('hex')),
      certReq: true,
    };
  }
}
