import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowUserRoles1758436800000 implements MigrationInterface {
  name = 'AddWorkflowUserRoles1758436800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE 'MANAGER'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE 'DIRECTOR'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE 'VALIDATOR'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres ne permet pas de retirer une valeur d'un ENUM proprement sans recréer le type.
  }
}
