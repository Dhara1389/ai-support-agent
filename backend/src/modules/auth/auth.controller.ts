import { Request, Response, NextFunction } from 'express';
import { authService, SafeUser } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { success } from '../../shared/utils/response.utils';

export interface AuthenticatedRequest extends Request {
  user: SafeUser;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto: RegisterDto = req.body;
    const result = await authService.register(dto);
    success(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto: LoginDto = req.body;
    const result = await authService.login(dto);
    success(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user } = req as AuthenticatedRequest;
    success(res, 'User profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};
