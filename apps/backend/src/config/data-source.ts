// src/config/data-source.ts
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const configService = new ConfigService();

// ✅ Import direct des entités pour éviter les problèmes de path
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { Signature } from '../entities/signature.entity';
import { AuditLog } from '../entities/audit-log.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: parseInt(configService.get('DATABASE_PORT', '5432')),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  
  // SSL Configuration pour Neon
  ssl: {
    rejectUnauthorized: false,
  },
  
  // ✅ Entités directement importées au lieu de patterns de fichiers
  entities: [User, Document, Signature, AuditLog],
  
  // Migrations
  migrations: [
    __dirname + '/../migrations/*{.ts,.js}',
  ],
  
  // Configuration migrations
  migrationsTableName: 'migrations',
  migrationsRun: false,
  
  // ✅ Synchronisation DÉSACTIVÉE - utiliser uniquement les migrations
  synchronize: false,
  
  // Logging pour debug
  logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
  
  // Options pour Neon
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});