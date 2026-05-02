// src/services/storage.service.spec.ts
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'esign-storage-test-'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'app' ? { storagePath: tmpDir } : undefined,
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('store', () => {
    it('should store data and return storage key', async () => {
      const data = Buffer.from('test file content');
      const options = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        ownerId: 'user-1',
      };

      const storageKey = await service.store(data, options);

      expect(storageKey).toBeDefined();
      expect(typeof storageKey).toBe('string');
      expect(storageKey).toContain('user-1');
    });

    it('should generate unique storage keys', async () => {
      const data = Buffer.from('test content');
      const options = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        ownerId: 'user-1',
      };

      const key1 = await service.store(data, options);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const key2 = await service.store(data, options);

      expect(key1).not.toBe(key2);
    });
  });

  describe('retrieve', () => {
    it('should retrieve stored data', async () => {
      const originalData = Buffer.from('test file content');
      const options = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        ownerId: 'user-1',
      };

      const storageKey = await service.store(originalData, options);
      const retrievedData = await service.retrieve(storageKey);

      expect(retrievedData).toEqual(originalData);
    });

    it('should retrieve from disk after cache would be empty (new service)', async () => {
      const originalData = Buffer.from('persisted');
      const key = await service.store(originalData, {
        fileName: 'a.bin',
        mimeType: 'application/octet-stream',
        ownerId: 'user-2',
      });

      const module2 = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: {
              get: (k: string) =>
                k === 'app' ? { storagePath: tmpDir } : undefined,
            },
          },
        ],
      }).compile();
      const fresh = module2.get<StorageService>(StorageService);

      await expect(fresh.retrieve(key)).resolves.toEqual(originalData);
    });

    it('should throw error for non-existent storage key', async () => {
      await expect(service.retrieve('non-existent-key')).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete stored data', async () => {
      const data = Buffer.from('test content');
      const options = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        ownerId: 'user-1',
      };

      const storageKey = await service.store(data, options);
      await service.delete(storageKey);

      await expect(service.retrieve(storageKey)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('getStorageSize', () => {
    it('should return storage size', async () => {
      const data = Buffer.from('test content');
      const options = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        ownerId: 'user-1',
      };

      await service.store(data, options);
      const size = service.getStorageSize();

      expect(size).toBeGreaterThan(0);
    });
  });
});
