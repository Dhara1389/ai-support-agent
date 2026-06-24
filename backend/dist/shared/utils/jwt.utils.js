"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return secret;
};
const getJwtExpiresIn = () => {
    return process.env.JWT_EXPIRES_IN || '7d';
};
const signToken = (payload) => {
    const options = {
        expiresIn: getJwtExpiresIn(),
    };
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), options);
};
exports.signToken = signToken;
const verifyToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
    if (typeof decoded === 'string') {
        throw new Error('Invalid token payload');
    }
    const { userId, email, role } = decoded;
    if (!userId || !email || !role) {
        throw new Error('Invalid token payload');
    }
    return { userId, email, role };
};
exports.verifyToken = verifyToken;
