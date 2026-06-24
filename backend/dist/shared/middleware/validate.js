"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const response_utils_1 = require("../utils/response.utils");
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_utils_1.error)(res, 'Validation failed', 422, errors.array());
            return;
        }
        next();
    };
};
exports.validate = validate;
