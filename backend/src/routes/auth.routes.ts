import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import {
  validate,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../middleware/validation.middleware';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put(
  '/password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);
router.post('/logout', protect, authController.logout);

export default router;
