// src/types/user.types.ts

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface SecurityContext {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}
