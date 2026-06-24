"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.success = void 0;
const success = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.success = success;
const error = (res, message, statusCode = 400, data = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data,
    });
};
exports.error = error;
