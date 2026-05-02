import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

export interface StorageOptions {
  fileName: string;
  mimeType: string;
  ownerId: string;
  encryption?: boolean;
}

/** Cache mémoire optionnelle pour éviter des lectures disque répétées (même processus). */
const memoryCache = new Map<string, Buffer>();

/**
 * Chemin stable vers `apps/backend/storage/uploads`, indépendant de `process.cwd()`
 * (sinon upload depuis la racine du repo vs depuis `apps/backend` écrit/lit deux dossiers différents).
 */
function defaultStorageRoot(): string {
  return path.resolve(__dirname, '..', '..', 'storage', 'uploads');
}

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  async store(data: Buffer, options: StorageOptions): Promise<string> {
    const storageKey = this.generateStorageKey(options);
    const filePath = this.resolveSafePath(storageKey);
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, data);
    memoryCache.set(storageKey, data);
    return storageKey;
  }

  async retrieve(storageKey: string): Promise<Buffer> {
    const cached = memoryCache.get(storageKey);
    if (cached) {
      return cached;
    }
    const filePath = this.resolveSafePath(storageKey);
    try {
      const data = await fsp.readFile(filePath);
      memoryCache.set(storageKey, data);
      return data;
    } catch {
      throw new Error(`File not found for storageKey=${storageKey}`);
    }
  }

  async delete(storageKey: string): Promise<void> {
    memoryCache.delete(storageKey);
    try {
      await fsp.unlink(this.resolveSafePath(storageKey));
    } catch {
      /* fichier déjà absent */
    }
  }

  /** Nombre de fichiers présents sous le répertoire de stockage. */
  getStorageSize(): number {
    const base = this.getBaseDir();
    if (!fs.existsSync(base)) {
      return 0;
    }
    return this.countFilesSync(base);
  }

  private getBaseDir(): string {
    const app = this.configService.get<AppConfig>('app');
    return app?.storagePath || defaultStorageRoot();
  }

  /**
   * Emploie la clé comme chemin relatif (ownerId/timestamp-random),
   * sans permettre de sortir du répertoire de stockage.
   */
  private resolveSafePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^[/\\]+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new Error(`Invalid storage key: ${storageKey}`);
    }
    const base = path.resolve(this.getBaseDir());
    const resolved = path.resolve(base, normalized);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new Error(`Invalid storage key (path escape): ${storageKey}`);
    }
    return resolved;
  }

  private countFilesSync(dir: string): number {
    let n = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        n += this.countFilesSync(p);
      } else {
        n += 1;
      }
    }
    return n;
  }

  private generateStorageKey(options: StorageOptions): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `${options.ownerId}/${timestamp}-${random}`;
  }
}
