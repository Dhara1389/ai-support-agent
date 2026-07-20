import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePdfDocument1782713395963 implements MigrationInterface {
    name = 'CreatePdfDocument1782713395963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pdf_documents\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`originalName\` varchar(255) NOT NULL, \`storedPath\` varchar(255) NOT NULL, \`extractedText\` longtext NULL, \`pageCount\` int NOT NULL DEFAULT '0', \`chromaCollectionName\` varchar(255) NOT NULL, \`uploadedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`isProcessed\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`pdf_documents\` ADD CONSTRAINT \`FK_be3c30b1ece7fcef79353bb7eb0\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pdf_documents\` DROP FOREIGN KEY \`FK_be3c30b1ece7fcef79353bb7eb0\``);
        await queryRunner.query(`DROP TABLE \`pdf_documents\``);
    }

}
