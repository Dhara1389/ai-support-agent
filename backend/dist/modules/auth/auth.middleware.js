"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const auth_service_1 = require("./auth.service");
const errorHandler_1 = require("../../shared/middleware/errorHandler");
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Access token is required', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new errorHandler_1.AppError('Access token is required', 401);
        }
        const user = await auth_service_1.authService.validateToken(token);
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
