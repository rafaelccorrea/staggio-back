import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePlanToEnum1709237000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'agency');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alter column to use ENUM type
    await queryRunner.query(`
      ALTER TABLE subscriptions 
      ALTER COLUMN plan TYPE plan_type USING plan::plan_type;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to VARCHAR
    await queryRunner.query(`
      ALTER TABLE subscriptions 
      ALTER COLUMN plan TYPE varchar(20) USING plan::text;
    `);

    // Drop ENUM type
    await queryRunner.query(`
      DROP TYPE IF EXISTS plan_type;
    `);
  }
}
