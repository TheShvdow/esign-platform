import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface StorageOptions {
  fileName: string;
  mimeType: string;
  ownerId: string;
  encryption?: boolean;
}

// ⚠️ Implémentation temporaire en mémoire pour valider le flux
// upload → signature → vérification.
// À remplacer plus tard par un vrai stockage sécurisé (S3, filesystem chiffré, etc.).
const inMemoryStore = new Map<string, Buffer>();

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  async store(data: Buffer, options: StorageOptions): Promise<string> {
    const storageKey = this.generateStorageKey(options);
    // Stockage brut en mémoire pour le moment
    inMemoryStore.set(storageKey, data);
    return storageKey;
  }

  async retrieve(storageKey: string): Promise<Buffer> {
    const data = inMemoryStore.get(storageKey);
    if (!data) {
      throw new Error(`File not found for storageKey=${storageKey}`);
    }
    return data;
  }

  // ✅ Méthode utilitaire pour nettoyer le stockage (utile pour les tests)
  async delete(storageKey: string): Promise<void> {
    inMemoryStore.delete(storageKey);
  }

  // ✅ Méthode pour obtenir la taille du stockage (monitoring)
  getStorageSize(): number {
    return inMemoryStore.size;
  }

  private generateStorageKey(options: StorageOptions): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `${options.ownerId}/${timestamp}-${random}`;
  }
}