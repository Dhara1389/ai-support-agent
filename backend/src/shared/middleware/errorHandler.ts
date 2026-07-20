import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { error as errorResponse } from '../utils/response.utils';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof TokenExpiredError) {
    errorResponse(res, 'Token has expired', 401);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    errorResponse(res, 'Invalid token', 401);
    return;
  }

  if (err.message === 'Email is already registered') {
    errorResponse(res, err.message, 409);
    return;
  }

  if (
    err.message === 'Invalid email or password' ||
    err.message === 'Invalid or expired token'
  ) {
    errorResponse(res, err.message, 401);
    return;
  }

  console.error(err);
  errorResponse(res, 'Internal server error', 500);
};
