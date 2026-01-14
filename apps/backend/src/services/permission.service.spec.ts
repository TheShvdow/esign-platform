// src/services/permission.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../types/global.types';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDocumentAccess', () => {
    it('should allow access for document owner', () => {
      const user = {
        id: 'user-1',
        hasRole: jest.fn().mockReturnValue(false),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(() => service.checkDocumentAccess(document, user)).not.toThrow();
    });

    it('should allow access for admin user', () => {
      const user = {
        id: 'user-2',
        hasRole: jest.fn().mockReturnValue(true),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(() => service.checkDocumentAccess(document, user)).not.toThrow();
      expect(user.hasRole).toHaveBeenCalledWith(UserRole.ADMIN);
    });

    it('should throw ForbiddenException for non-owner non-admin user', () => {
      const user = {
        id: 'user-2',
        hasRole: jest.fn().mockReturnValue(false),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(() => service.checkDocumentAccess(document, user)).toThrow(ForbiddenException);
      expect(() => service.checkDocumentAccess(document, user)).toThrow('Access denied');
    });
  });

  describe('canUserAccessDocument', () => {
    it('should return true for document owner', () => {
      const user = {
        id: 'user-1',
        hasRole: jest.fn().mockReturnValue(false),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(service.canUserAccessDocument(document, user)).toBe(true);
    });

    it('should return true for admin user', () => {
      const user = {
        id: 'user-2',
        hasRole: jest.fn().mockReturnValue(true),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(service.canUserAccessDocument(document, user)).toBe(true);
    });

    it('should return false for non-owner non-admin user', () => {
      const user = {
        id: 'user-2',
        hasRole: jest.fn().mockReturnValue(false),
      } as unknown as User;

      const document = {
        ownerId: 'user-1',
      } as Document;

      expect(service.canUserAccessDocument(document, user)).toBe(false);
    });
  });
});
