import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Configuration
import configuration from './config/configuration';

// Entities
import { User } from './entities/user.entity';
import { Document } from './entities/document.entity';
import { Signature } from './entities/signature.entity';
import { Certificate } from './entities/certificate.entity';
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
        host: configService.get('DATABASE_HOST') || 'localhost',
        port: configService.get('DATABASE_PORT') || 5432,
        username: configService.get('DATABASE_USERNAME') || 'postgres',
        password: configService.get('DATABASE_PASSWORD') || 'password',
        database: configService.get('DATABASE_NAME') || 'esign',
        entities: [User, Document, Signature, Certificate, AuditLog],
        //synchronize: configService.get('NODE_ENV') === 'development',
        ssl: {
    rejectUnauthorized: false,
  },
        logging: configService.get('NODE_ENV') === 'development',
      })
    }),
    TypeOrmModule.forFeature([User, Document, Signature, Certificate, AuditLog]),
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