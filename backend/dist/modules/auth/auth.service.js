"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const database_1 = require("../../config/database");
const auth_entity_1 = require("./auth.entity");
const password_utils_1 = require("../../shared/utils/password.utils");
const jwt_utils_1 = require("../../shared/utils/jwt.utils");
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(auth_entity_1.User);
    }
    async register(dto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new Error('Email is already registered');
        }
        const hashedPassword = await (0, password_utils_1.hashPassword)(dto.password);
        const user = this.userRepository.create({
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
            role: auth_entity_1.UserRole.USER,
            isActive: true,
        });
        await this.userRepository.save(user);
        const token = (0, jwt_utils_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return { user: this.toSafeUser(user), token };
    }
    async login(dto) {
        const user = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
        }
        const isPasswordValid = await (0, password_utils_1.comparePassword)(dto.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = (0, jwt_utils_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return { user: this.toSafeUser(user), token };
    }
    async validateToken(token) {
        const payload = (0, jwt_utils_1.verifyToken)(token);
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
    toSafeUser(user) {
        const { password: _password, ...safeUser } = user;
        return safeUser;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
