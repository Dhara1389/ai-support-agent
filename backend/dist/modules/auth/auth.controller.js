"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const auth_service_1 = require("./auth.service");
const response_utils_1 = require("../../shared/utils/response.utils");
const register = async (req, res, next) => {
    try {
        const dto = req.body;
        const result = await auth_service_1.authService.register(dto);
        (0, response_utils_1.success)(res, 'User registered successfully', result, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const dto = req.body;
        const result = await auth_service_1.authService.login(dto);
        (0, response_utils_1.success)(res, 'Login successful', result);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const { user } = req;
        (0, response_utils_1.success)(res, 'User profile fetched successfully', user);
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
