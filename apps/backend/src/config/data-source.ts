// src/config/data-source.ts
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  
  // SSL Configuration pour Neon (requis)
  ssl: {
    rejectUnauthorized: false,
  },
  
  // Entités
  entities: [
    __dirname + '/../entities/*.entity{.ts,.js}',
  ],
  
  // Migrations
  migrations: [
    __dirname + '/../migrations/*{.ts,.js}',
  ],
  
  // Configuration migrations
  migrationsTableName: 'migrations',
  migrationsRun: false,
  
  // Synchronisation TEMPORAIRE - pour créer le schéma initial
  synchronize: true, // TEMPORAIRE - passer à false après création
  
  // Logging
  logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
  
  // Autres options
  dropSchema: false,
  cache: {
    duration: 30000,
  },
  
  // Pool de connexions pour Neon
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

// Configuration pour NestJS
export const typeOrmConfig = {
  type: 'postgres' as const,
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  
  ssl: {
    rejectUnauthorized: false,
  },
  
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  
  synchronize: true, // TEMPORAIRE
  logging: configService.get('NODE_ENV') === 'development',
  
  // Options de pool pour Neon
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  
  // Cache
  cache: {
    duration: 30000,
  },
};