import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1758436792987 implements MigrationInterface {
    name = 'InitialSchema1758436792987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."signatures_type_enum" AS ENUM('SIMPLE', 'ADVANCED', 'QUALIFIED')`);
        await queryRunner.query(`CREATE TABLE "signatures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentId" uuid NOT NULL, "signerId" uuid NOT NULL, "type" "public"."signatures_type_enum" NOT NULL, "signatureValue" text NOT NULL, "metadata" jsonb NOT NULL, "cryptographicEvidence" jsonb NOT NULL, "certificateId" character varying NOT NULL, "certificatePem" text NOT NULL, "tsaResponse" character varying, "isValid" boolean NOT NULL DEFAULT false, "validationErrors" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f56eb3cd344ce7f9ae28ce814eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."documents_status_enum" AS ENUM('DRAFT', 'PENDING_SIGNATURE', 'PARTIALLY_SIGNED', 'FULLY_SIGNED', 'EXPIRED', 'REJECTED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "file_name" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "file_size" bigint NOT NULL, "storage_key" character varying(500) NOT NULL, "file_hash" character varying(128) NOT NULL, "hash_algorithm" character varying(50) NOT NULL DEFAULT 'sha256', "status" "public"."documents_status_enum" NOT NULL DEFAULT 'PENDING_SIGNATURE', "expires_at" TIMESTAMP, "metadata" jsonb, "owner_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ac6db0be1ba323e80e653b0e6" ON "documents" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_2aab7c12d8ec1207288771bf42" ON "documents" ("file_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_961e46e0c19d2cac9bc85b510f" ON "documents" ("owner_id", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATE', 'USER_DELETE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_VIEW', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE', 'DOCUMENT_SIGN', 'DOCUMENT_VERIFY', 'DOCUMENT_SHARE', 'CERTIFICATE_CREATE', 'CERTIFICATE_REVOKE', 'CERTIFICATE_RENEW', 'ADMIN_ACCESS', 'SYSTEM_CONFIG_CHANGE', 'SECURITY_ALERT')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_logs_action_enum" NOT NULL, "userId" uuid, "entityType" character varying, "entityId" uuid, "details" jsonb NOT NULL, "ipAddress" character varying NOT NULL, "userAgent" character varying NOT NULL, "sessionId" character varying NOT NULL, "cryptographicHash" character varying NOT NULL, "previousHash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "isActive" boolean NOT NULL DEFAULT true, "emailVerified" boolean NOT NULL DEFAULT false, "mfaSecret" character varying, "mfaEnabled" boolean NOT NULL DEFAULT false, "lastLoginAt" TIMESTAMP, "lastLoginIp" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_7be2557c5208359daf74f35a772" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_752c037022f75add96ab8707378" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_888a4852e27627d1ebd8a094e98" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_888a4852e27627d1ebd8a094e98"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_752c037022f75add96ab8707378"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_7be2557c5208359daf74f35a772"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_961e46e0c19d2cac9bc85b510f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2aab7c12d8ec1207288771bf42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ac6db0be1ba323e80e653b0e6"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TYPE "public"."documents_status_enum"`);
        await queryRunner.query(`DROP TABLE "signatures"`);
        await queryRunner.query(`DROP TYPE "public"."signatures_type_enum"`);
    }

}
