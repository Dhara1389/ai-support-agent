"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../database/entities/User");
const PdfDocument_1 = require("../database/entities/PdfDocument");
dotenv_1.default.config();
const isDevelopment = process.env.NODE_ENV === 'development';
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_support_agent',
    entities: [User_1.User, PdfDocument_1.PdfDocument],
    synchronize: false,
    logging: isDevelopment,
    migrations: ['src/database/migrations/*.ts'],
    migrationsTableName: 'migrations',
});
const initializeDatabase = async () => {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
    }
};
exports.initializeDatabase = initializeDatabase;
