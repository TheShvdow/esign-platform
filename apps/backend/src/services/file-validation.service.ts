// src/services/file-validation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { FileValidationRules, FileValidationResult } from '../types/global.types';

@Injectable()
export class FileValidationService {
  private readonly defaultRules: FileValidationRules = {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  };

  validate(file: Express.Multer.File, rules?: Partial<FileValidationRules>): void {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: string[] = [];

    if (!validationRules.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    if (file.size > validationRules.maxSizeBytes) {
      const maxSizeMB = validationRules.maxSizeBytes / (1024 * 1024);
      errors.push(`File size exceeds limit of ${maxSizeMB}MB`);
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(', '));
    }
  }

  validateWithResult(file: Express.Multer.File, rules?: Partial<FileValidationRules>): FileValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: string[] = [];

    if (!validationRules.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    if (file.size > validationRules.maxSizeBytes) {
      const maxSizeMB = validationRules.maxSizeBytes / (1024 * 1024);
      errors.push(`File size exceeds limit of ${maxSizeMB}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
