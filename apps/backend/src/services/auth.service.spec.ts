// src/services/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../types/global.types';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: bcrypt.hashSync('Test123456', 12),
    role: UserRole.USER,
    isActive: true,
    emailVerified: false,
    mfaEnabled: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'Test123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'Test123456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'Test123456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'newuser@example.com',
        password: 'Test123456',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('newuser@example.com');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Test123456',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should set default role to USER if not provided', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.register({
        email: 'newuser@example.com',
        password: 'Test123456',
        firstName: 'New',
        lastName: 'User',
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.USER,
        }),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid payload', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser({ sub: 'user-1' });

      expect(result).toEqual(mockUser);
    });

    it('should return null for inactive user', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser({ sub: 'user-1' });

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser({ sub: 'non-existent' });

      expect(result).toBeNull();
    });
  });
});
