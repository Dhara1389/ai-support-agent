import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import authRoutes from './modules/auth/auth.routes';
import pdfChatRoutes from './modules/pdf-chat/pdf-chat.routes';
import dbAnalyserRoutes from './modules/db-analyser/db-analyser.routes';
import { errorHandler } from './shared/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api/pdf-chat', pdfChatRoutes);
app.use('/api/db-analyser', dbAnalyserRoutes);

// TODO: Mount resume-analyser module router — /api/resume-analyser
// TODO: Mount document-analyser module router — /api/document-analyser

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error: Error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

export default app;
