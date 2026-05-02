export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Rôles métier possibles (workflow) + USER / ADMIN */
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
