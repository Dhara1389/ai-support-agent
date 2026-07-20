import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export const success = <T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode = 200,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (
  res: Response,
  message: string,
  statusCode = 400,
  data: unknown = null,
): Response<ApiResponse<unknown>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
