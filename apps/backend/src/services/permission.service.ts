// src/services/permission.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../types/global.types';

@Injectable()
export class PermissionService {
  checkDocumentAccess(document: Document, user: User): void {
    if (document.ownerId !== user.id && !user.hasRole(UserRole.ADMIN)) {
      throw new ForbiddenException('Access denied');
    }
  }

  canUserAccessDocument(document: Document, user: User): boolean {
    return document.ownerId === user.id || user.hasRole(UserRole.ADMIN);
  }
}
