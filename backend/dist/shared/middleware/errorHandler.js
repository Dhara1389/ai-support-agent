"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const response_utils_1 = require("../utils/response.utils");
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        (0, response_utils_1.error)(res, err.message, err.statusCode);
        return;
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        (0, response_utils_1.error)(res, 'Token has expired', 401);
        return;
    }
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        (0, response_utils_1.error)(res, 'Invalid token', 401);
        return;
    }
    if (err.message === 'Email is already registered') {
        (0, response_utils_1.error)(res, err.message, 409);
        return;
    }
    if (err.message === 'Invalid email or password' ||
        err.message === 'Invalid or expired token') {
        (0, response_utils_1.error)(res, err.message, 401);
        return;
    }
    console.error(err);
    (0, response_utils_1.error)(res, 'Internal server error', 500);
};
exports.errorHandler = errorHandler;
