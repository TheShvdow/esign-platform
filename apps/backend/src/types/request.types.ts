// src/types/request.types.ts
import { Request } from 'express';
import { UserRole } from './user.types';
import type { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
