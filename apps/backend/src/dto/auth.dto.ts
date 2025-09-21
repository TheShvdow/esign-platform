// src/dto/auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsString, 
  IsEnum, 
  MinLength, 
  MaxLength,
  IsOptional
} from 'class-validator';
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
  @ApiProperty({ 
    example: 'derisswvde@gmail.com',
    description: 'User email address'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    example: 'Passer123',
    description: 'User password',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ 
    example: 'derisswvde@gmail.com',
    description: 'User email address'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    example: 'Passer123',
    description: 'User password',
    minLength: 8,
    maxLength: 128
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @ApiProperty({ 
    example: 'Idrissa',
    description: 'User first name'
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({ 
    example: 'Wade',
    description: 'User last name'
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.USER,
    description: 'User role',
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
  role?: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds'
  })
  expiresIn: number;

  @ApiProperty({ 
    type: UserDto,
    description: 'User information'
  })
  user: UserDto;
}