import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { registerValidation, loginValidation } from './auth.dto';
import { verifyToken } from './auth.middleware';
import { validate } from '../../shared/middleware/validate';

const router = Router();

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/me', verifyToken, getMe);

export default router;
