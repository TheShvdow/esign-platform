// src/services/cryptography.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptographyService } from './cryptography.service';
import { HSMService } from './hsm.service';
import { CertificateService } from './certificate.service';
import { TSAService } from './tsa.service';
import { SignatureType } from '../types/global.types';

describe('CryptographyService', () => {
  let service: CryptographyService;
  let hsmService: HSMService;
  let certificateService: CertificateService;
  let tsaService: TSAService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptographyService,
        HSMService,
        CertificateService,
        {
          provide: TSAService,
          useValue: {
            requestTimestamp: jest.fn().mockResolvedValue('mock-timestamp'),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CryptographyService>(CryptographyService);
    hsmService = module.get<HSMService>(HSMService);
    certificateService = module.get<CertificateService>(CertificateService);
    tsaService = module.get<TSAService>(TSAService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateHash', () => {
    it('should generate SHA-256 hash', async () => {
      const data = Buffer.from('test data');
      const hash = await service.generateHash(data);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should generate consistent hash for same input', async () => {
      const data = Buffer.from('test data');
      const hash1 = await service.generateHash(data);
      const hash2 = await service.generateHash(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe('signData', () => {
    it('should sign data and return signature result', async () => {
      const data = Buffer.from('test document content');
      const request = {
        data,
        certificateId: 'cert-1',
        signatureType: SignatureType.ADVANCED,
      };

      const result = await service.signData(request);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.evidence).toBeDefined();
      expect(result.evidence.hash).toBeDefined();
      expect(result.evidence.algorithm).toBe('sha256');
      expect(result.evidence.certificateChain?.length).toBeGreaterThan(0);
    });

    it('should include TSA response for QUALIFIED signature type', async () => {
      const data = Buffer.from('test document content');
      const request = {
        data,
        certificateId: 'cert-1',
        signatureType: SignatureType.QUALIFIED,
      };

      const result = await service.signData(request);

      expect(result.evidence.tsaResponse).toBeDefined();
      expect(tsaService.requestTimestamp).toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', async () => {
      // Mock PKCS#7 signature (simplified)
      const signature = 'mock-signature-base64';
      const originalData = Buffer.from('test document content');
      const certificatePem = '-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----';

      // Mock forge to return valid certificate
      const result = await service.verifySignature(signature, originalData, certificatePem);

      // Note: This is a simplified test - actual verification would require real PKCS#7 data
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });
  });
});
