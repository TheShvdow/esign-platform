// src/services/permission.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../types/global.types';

@Injectable()
export class PermissionService {
  checkDocumentAccess(document: Document, user: User): void {
    if (user.hasRole(UserRole.ADMIN)) {
      return;
    }
    if (document.ownerId === user.id) {
      return;
    }
    const meta = document.metadata;
    if (meta?.participantUserIds?.includes(user.id)) {
      return;
    }
    if (meta?.workflow?.some((s) => s.assigneeUserId === user.id)) {
      return;
    }
    if (
      meta?.workflow?.some((s) => s.allowedRoles?.includes(user.role))
    ) {
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  canUserAccessDocument(document: Document, user: User): boolean {
    try {
      this.checkDocumentAccess(document, user);
      return true;
    } catch {
      return false;
    }
  }
}
