// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Configuration
import configuration from './config/configuration';

// Entities - ✅ Import direct sans Certificate pour éviter les erreurs
import { User } from './entities/user.entity';
import { Document } from './entities/document.entity';
import { Signature } from './entities/signature.entity';
import { AuditLog } from './entities/audit-log.entity';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { DocumentsController } from './controllers/documents.controller';

// Services
import { AuthService } from './services/auth.service';
import { DocumentService } from './services/document.service';
import { CryptographyService } from './services/cryptography.service';
import { StorageService } from './services/storage.service';
import { AuditService } from './services/audit.service';
import { NotificationService } from './services/notification.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        // ✅ Utilisation des mêmes variables que data-source.ts
        host: configService.get('DATABASE_HOST'),
        port: parseInt(configService.get('DATABASE_PORT', '5432')),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        
        // ✅ Entités explicites - sans Certificate pour éviter les erreurs
        entities: [User, Document, Signature, AuditLog],
        
        // ✅ Synchronisation désactivée - utiliser UNIQUEMENT les migrations
        synchronize: false,
        
        ssl: {
          rejectUnauthorized: false,
        },
        
        logging: configService.get('NODE_ENV') === 'development',
        
        // Pool de connexions pour Neon
        extra: {
          connectionLimit: 10,
          acquireTimeout: 60000,
          timeout: 60000,
        },
      })
    }),
    
    // ✅ Repository features - sans Certificate
    TypeOrmModule.forFeature([User, Document, Signature, AuditLog]),
    
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }])
  ],
  controllers: [AuthController, DocumentsController],
  providers: [
    AuthService,
    DocumentService,
    CryptographyService,
    StorageService,
    AuditService,
    NotificationService,
    JwtStrategy
  ]
})
export class AppModule {}