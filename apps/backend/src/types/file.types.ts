// src/types/file.types.ts

export interface FileValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface FileValidationRules {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}
