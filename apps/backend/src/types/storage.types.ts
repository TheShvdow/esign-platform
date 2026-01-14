// src/types/storage.types.ts

export interface StorageOptions {
  fileName: string;
  mimeType: string;
  ownerId: string;
  encryption?: boolean;
  retention?: number;
}
