import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.controller';
import { pdfChatService } from './pdf-chat.service';
import { AskQuestionDto } from './pdf-chat.dto';
import { success } from '../../shared/utils/response.utils';
import { AppError } from '../../shared/middleware/errorHandler';

export const uploadPdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;

    if (!req.file) {
      throw new AppError('PDF file is required', 400);
    }

    const result = await pdfChatService.uploadAndProcess(req.file, user.id);
    
    success(res, 'PDF uploaded and processed successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const askQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { documentId, question } = req.body as AskQuestionDto;

    const result = await pdfChatService.askQuestion(
      documentId,
      question,
      user.id,
    );

    success(res, 'Question answered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;
    const documents = await pdfChatService.listDocuments(user.id);

    const data = documents.map((document) => ({
      id: document.id,
      originalName: document.originalName,
      pageCount: document.pageCount,
      chromaCollectionName: document.chromaCollectionName,
      uploadedAt: document.uploadedAt,
      isProcessed: document.isProcessed,
    }));

    success(res, 'Documents fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!id) {
      throw new AppError('Document ID is required', 400);
    }

    await pdfChatService.deleteDocument(id.toString(), user.id);
    success(res, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};
