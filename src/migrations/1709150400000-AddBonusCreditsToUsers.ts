import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBonusCreditsToUsers1709150400000 implements MigrationInterface {
  name = 'AddBonusCreditsToUsers1709150400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna já existe antes de adicionar
    const hasColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bonus_credits'
    `);

    if (hasColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "bonus_credits" integer NOT NULL DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "bonus_credits"
    `);
  }
}
