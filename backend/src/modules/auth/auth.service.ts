import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from './auth.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { hashPassword, comparePassword } from '../../shared/utils/password.utils';
import { signToken, verifyToken } from '../../shared/utils/jwt.utils';

export type SafeUser = Omit<User, 'password'>;

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export class AuthService {
  private readonly userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: UserRole.USER,
      isActive: true,
    });

    await this.userRepository.save(user);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: this.toSafeUser(user), token };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: this.toSafeUser(user), token };
  }

  async validateToken(token: string): Promise<SafeUser> {
    const payload = verifyToken(token);

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid or expired token');
    }

    if (user.email !== payload.email || user.role !== payload.role) {
      throw new Error('Invalid or expired token');
    }

    return this.toSafeUser(user);
  }

  private toSafeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
