// src/dto/auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../types/global.types';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  mfaEnabled: boolean;

  @ApiProperty()
  createdAt: Date;
}
export class LoginDto {
  @ApiProperty({ example: 'email' })
  email: string;
  @ApiProperty({ example: 'password' })
  password: string;
}
export class RegisterDto {
  @ApiProperty({ example: 'email' })
  email: string;
  @ApiProperty({ example: 'password' })
  password: string;
  @ApiProperty({ example: 'firstName' })
  firstName: string;
  @ApiProperty({ example: 'lastName' })
  lastName: string;
  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;
}
export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
  @ApiProperty()
  expiresIn: number;
  @ApiProperty({ type: UserDto })
  user: UserDto;
}