// src/services/storage.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
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
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
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

    it('should throw error for non-existent storage key', async () => {
      await expect(
        service.retrieve('non-existent-key'),
      ).rejects.toThrow('File not found');
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

      await expect(
        service.retrieve(storageKey),
      ).rejects.toThrow('File not found');
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
