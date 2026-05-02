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
  constructor(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    isActive: boolean,
    emailVerified: boolean,
    mfaEnabled: boolean,
    createdAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.isActive = isActive;
    this.emailVerified = emailVerified;
    this.mfaEnabled = mfaEnabled;
    this.createdAt = createdAt;
  }
  @ApiProperty()
  @ApiProperty()
id: string; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  @ApiProperty()
isActive: boolean; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty()
  @ApiProperty()
emailVerified: boolean; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty()
  @ApiProperty()
mfaEnabled: boolean; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty()
  @ApiProperty()
createdAt: Date; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.
}

export class LoginDto {
  constructor(
    email: string,
    password: string,
  ) {
    this.email = email;
    this.password = password;
  }
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
  constructor(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: UserRole,
  ) {
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
  }
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
  @IsOptional()
@IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
@IsOptional()
@IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
role?: UserRole; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.
}

export class AuthResponseDto {
  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    user: UserDto,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
    this.user = user;
  }
  @ApiProperty({
    description: 'JWT access token'
  })
  @ApiProperty()
accessToken: string; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty({
    description: 'JWT refresh token'
  })
  @ApiProperty()
refreshToken: string; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty({
    description: 'Token expiration time in seconds'
  })
  @ApiProperty()
expiresIn: number; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.

  @ApiProperty({ 
    type: UserDto,
    description: 'User information'
  })
  @ApiProperty({ type: UserDto })
user: UserDto; // Initialiser dans le constructeur ou utiliser le point d'interrogation si optionnel.
}