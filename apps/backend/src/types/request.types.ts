// src/types/request.types.ts
import { Request } from 'express';
import { UserRole } from './user.types';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    [key: string]: any;
  };
}
