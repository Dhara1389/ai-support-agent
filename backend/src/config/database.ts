import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../database/entities/User';
import { PdfDocument } from '../database/entities/PdfDocument'

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_support_agent',
  entities: [User,PdfDocument],
  synchronize: false,
  logging: isDevelopment,
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
  
export const initializeDatabase = async (): Promise<void> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
};
