// src/types/user.types.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  VALIDATOR = 'VALIDATOR',
  USER = 'USER',
}

export interface SecurityContext {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}
