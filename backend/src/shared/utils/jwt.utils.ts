import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../../database/entities/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return secret;
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

export const signToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, getJwtSecret(), options);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  const { userId, email, role } = decoded as JwtPayload;

  if (!userId || !email || !role) {
    throw new Error('Invalid token payload');
  }

  return { userId, email, role };
};
