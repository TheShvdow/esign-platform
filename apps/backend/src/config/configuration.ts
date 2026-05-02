// src/config/configuration.ts
import * as path from 'path';
import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface HsmConfig {
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  slot: number;
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  corsOrigins: string[];
  maxFileSize: number;
  rateLimitTtl: number;
  rateLimitLimit: number;
  /** Répertoire racine pour les fichiers uploadés (survit aux redémarrages du processus). */
  storagePath: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3000', 10),
    environment:
      (process.env.NODE_ENV as AppConfig['environment']) || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    storagePath:
      process.env.STORAGE_PATH ||
      path.resolve(__dirname, '..', '..', 'storage', 'uploads'),
  }),
);
