import cookieParser from 'cookie-parser';
import { Router } from 'express';
import {
  currentUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();
authRouter.use(cookieParser());
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
authRouter.use(authRateLimiter);
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/refresh', refreshUserSession);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', requireAuth, currentUser);
