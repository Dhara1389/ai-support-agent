import { Router } from 'express';
import { upload } from '../../config/multer';
import { verifyToken as authMiddleware } from '../auth/auth.middleware';
import {
  uploadPdf,
  askQuestion,
  getDocuments,
  deleteDocument,
} from './pdf-chat.controller';
import { askQuestionValidation } from './pdf-chat.dto';

const router = Router();

router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  uploadPdf,
);

router.post(
  '/ask',
  authMiddleware,
  askQuestionValidation,
  askQuestion,
);

router.get(
  '/documents',
  authMiddleware,
  getDocuments,
);

router.delete(
  '/documents/:id',
  authMiddleware,
  deleteDocument,
);

export default router;