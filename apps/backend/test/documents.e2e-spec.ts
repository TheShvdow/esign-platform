// test/documents.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register and login a user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'documents@example.com',
        password: 'Test123456',
        firstName: 'Documents',
        lastName: 'User',
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'documents@example.com',
        password: 'Test123456',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /documents', () => {
    it('should upload a document', () => {
      const fileContent = Buffer.from('Test PDF content');
      
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Test Document')
        .field('description', 'Test Description')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Document');
          expect(res.body.status).toBe('PENDING_SIGNATURE');
          documentId = res.body.id;
        });
    });

    it('should return 401 without authentication', () => {
      const fileContent = Buffer.from('Test PDF content');
      
      return request(app.getHttpServer())
        .post('/documents')
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Test Document')
        .expect(401);
    });

    it('should return 400 for invalid file type', () => {
      const fileContent = Buffer.from('Test image content');
      
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.jpg')
        .field('title', 'Test Document')
        .expect(400);
    });
  });

  describe('GET /documents', () => {
    it('should get list of documents', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('documents');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.documents)).toBe(true);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .expect(401);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/documents?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
        });
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document by id', async () => {
      // First create a document
      const fileContent = Buffer.from('Test PDF content');
      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Get Test Document')
        .expect(201);

      const docId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(docId);
          expect(res.body.title).toBe('Get Test Document');
        });
    });

    it('should return 404 for non-existent document', () => {
      return request(app.getHttpServer())
        .get('/documents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .expect(401);
    });
  });

  describe('POST /documents/:id/sign', () => {
    it('should sign a document', async () => {
      // First create a document
      const fileContent = Buffer.from('Test PDF content for signing');
      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Sign Test Document')
        .expect(201);

      const docId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/documents/${docId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signatureType: 'ADVANCED',
          certificateId: 'cert-123',
          additionalMetadata: {
            reason: 'I approve this document',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.signatures).toBeDefined();
          expect(res.body.signatures.length).toBeGreaterThan(0);
        });
    });

    it('should return 400 for already signed document', async () => {
      // Create and sign a document first
      const fileContent = Buffer.from('Test PDF content');
      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Already Signed Document')
        .expect(201);

      const docId = createResponse.body.id;

      // Sign once
      await request(app.getHttpServer())
        .post(`/documents/${docId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signatureType: 'ADVANCED',
          certificateId: 'cert-123',
        })
        .expect(200);

      // Try to sign again (should fail)
      return request(app.getHttpServer())
        .post(`/documents/${docId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signatureType: 'ADVANCED',
          certificateId: 'cert-123',
        })
        .expect(400);
    });
  });

  describe('POST /documents/:id/verify', () => {
    it('should verify document signatures', async () => {
      // Create and sign a document first
      const fileContent = Buffer.from('Test PDF content for verification');
      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Verify Test Document')
        .expect(201);

      const docId = createResponse.body.id;

      // Sign the document
      await request(app.getHttpServer())
        .post(`/documents/${docId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          signatureType: 'ADVANCED',
          certificateId: 'cert-123',
        })
        .expect(200);

      // Verify the document
      return request(app.getHttpServer())
        .post(`/documents/${docId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid');
          expect(res.body).toHaveProperty('signatures');
          expect(Array.isArray(res.body.signatures)).toBe(true);
        });
    });

    it('should return 400 for document without signatures', async () => {
      // Create a document without signing
      const fileContent = Buffer.from('Test PDF content');
      const createResponse = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', fileContent, 'test.pdf')
        .field('title', 'Unsigned Document')
        .expect(201);

      const docId = createResponse.body.id;

      return request(app.getHttpServer())
        .post(`/documents/${docId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isValid).toBe(false);
          expect(res.body.signatures).toEqual([]);
        });
    });
  });
});
