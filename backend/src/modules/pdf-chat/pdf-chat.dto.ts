import { body, ValidationChain } from 'express-validator';

export interface UploadPdfDto {
  originalName: string;
}

export interface AskQuestionDto {
  documentId: string;
  question: string;
}

export const askQuestionValidation: ValidationChain[] = [
  body('documentId')
    .trim()
    .isUUID()
    .withMessage('A valid document ID is required'),
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Question must be between 3 and 2000 characters'),
];
