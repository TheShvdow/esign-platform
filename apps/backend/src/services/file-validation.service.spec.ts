// src/services/file-validation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileValidationService } from './file-validation.service';

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileValidationService],
    }).compile();

    service = module.get<FileValidationService>(FileValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should validate a valid PDF file', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
      } as Express.Multer.File;

      expect(() => service.validate(file)).not.toThrow();
    });

    it('should validate a valid Word document', () => {
      const file = {
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2 * 1024 * 1024, // 2MB
      } as Express.Multer.File;

      expect(() => service.validate(file)).not.toThrow();
    });

    it('should throw BadRequestException for invalid file type', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      expect(() => service.validate(file)).toThrow(BadRequestException);
      expect(() => service.validate(file)).toThrow('File type image/jpeg not allowed');
    });

    it('should throw BadRequestException for file exceeding size limit', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB
      } as Express.Multer.File;

      expect(() => service.validate(file)).toThrow(BadRequestException);
      expect(() => service.validate(file)).toThrow('File size exceeds limit');
    });

    it('should accept custom validation rules', () => {
      const file = {
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const customRules = {
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        maxSizeBytes: 5 * 1024 * 1024,
      };

      expect(() => service.validate(file, customRules)).not.toThrow();
    });
  });

  describe('validateWithResult', () => {
    it('should return isValid true for valid file', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024 * 1024,
      } as Express.Multer.File;

      const result = service.validateWithResult(file);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return isValid false with errors for invalid file', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const result = service.validateWithResult(file);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });
});
