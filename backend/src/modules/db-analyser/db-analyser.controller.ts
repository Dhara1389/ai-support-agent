import { Request, Response, NextFunction } from 'express';
import { dbAnalyserService } from './db-analyser.service';
import { ConnectDbDto, NlQueryDto } from './db-analyser.dto';
import { success } from '../../shared/utils/response.utils';
import { AuthenticatedRequest } from '../../modules/auth/auth.controller';

export const connectAndInspect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto: ConnectDbDto = req.body;
    const userId = (req as AuthenticatedRequest).user.id;
    const result = await dbAnalyserService.connectAndInspect(dto, userId);
    success(res, 'Database connected and schema loaded successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const generateAndRunQuery = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto: NlQueryDto = req.body;
    const userId = (req as AuthenticatedRequest).user.id;
    const result = await dbAnalyserService.generateAndRunQuery(
      dto.connectionId,
      dto.question,
      userId,
    );
    success(res, 'Query executed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const connectionId = req.params.connectionId as string;
    const userId = (req as AuthenticatedRequest).user.id;
    const schema = dbAnalyserService.getSchema(connectionId, userId);
    success(res, 'Schema fetched successfully', schema);
  } catch (error) {
    next(error);
  }
};

export const disconnectDb = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const connectionId = req.params.connectionId as string;
    const userId = (req as AuthenticatedRequest).user.id;
    const result = await dbAnalyserService.disconnectDb(connectionId, userId);
    success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const listConnections = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const connections = dbAnalyserService.listConnections(userId);
    success(res, 'Connections fetched successfully', connections);
  } catch (error) {
    next(error);
  }
};
