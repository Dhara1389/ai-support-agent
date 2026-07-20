import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from './auth.controller';
import { AppError } from '../../shared/middleware/errorHandler';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    const user = await authService.validateToken(token);
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
};
