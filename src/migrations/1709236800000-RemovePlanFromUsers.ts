import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemovePlanFromUsers1709236800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove the plan column from users table
    await queryRunner.dropColumn('users', 'plan');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add the plan column back if migration is reverted
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'plan',
        type: 'varchar',
        length: '20',
        default: "'free'",
      }),
    );
  }
}
