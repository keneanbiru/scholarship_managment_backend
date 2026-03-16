import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/password-reset-request', AuthController.requestPasswordReset);
router.post('/password-reset', AuthController.resetPassword);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/oauth/google', AuthController.googleOAuth);
router.get('/oauth/google/callback', AuthController.googleOAuthCallback);
router.get('/oauth/linkedin', AuthController.linkedInOAuth);
router.get('/oauth/linkedin/callback', AuthController.linkedInOAuthCallback);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, AuthController.getProfile);
router.get('/me', authMiddleware, AuthController.me);

export default router;

