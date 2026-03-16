import { RegisterUser } from '../usecases/auth/RegisterUser.js';
import { LoginUser } from '../usecases/auth/LoginUser.js';
import { PasswordHasher } from '../infrastructure/auth/passwordHasher.js';
import { JWTService } from '../infrastructure/auth/jwtService.js';
import { TokenStore } from '../infrastructure/auth/tokenStore.js';
import { UserRepositoryImpl } from '../repositories/UserRepositoryImpl.js';
import { env } from '../config/env.js';
import { HTTP_STATUS } from '../config/constants.js';
import crypto from 'crypto';
import axios from 'axios';

// Auth Controller
export class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, role } = req.body;

      const registerUser = new RegisterUser();
      const result = await registerUser.execute({ email, password, role });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const loginUser = new LoginUser();
      const result = await loginUser.execute({ email, password });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  // Logout user by invalidating access/refresh tokens
  static async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = JWTService.extractTokenFromHeader(authHeader);
      const { refreshToken } = req.body || {};

      if (!accessToken && !refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Access token or refresh token is required for logout'
        });
      }

      if (accessToken) {
        const accessDecoded = JWTService.decodeToken(accessToken);
        if (accessDecoded?.exp) {
          TokenStore.blacklistAccessToken(accessToken, accessDecoded.exp * 1000);
        }
      }

      if (refreshToken) {
        TokenStore.revokeRefreshToken(refreshToken);
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }

  // Refresh access token using a valid refresh token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const decoded = JWTService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      const stored = TokenStore.getRefreshToken(refreshToken);
      if (!stored || stored.userId !== decoded.userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token is revoked or not recognized'
        });
      }

      const userRepository = new UserRepositoryImpl();
      const user = await userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User account is not active'
        });
      }

      TokenStore.revokeRefreshToken(refreshToken);
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role.toString()
      };
      const accessToken = JWTService.generateToken(payload);
      const nextRefreshToken = JWTService.generateRefreshToken(payload);
      const refreshDecoded = JWTService.decodeToken(nextRefreshToken);
      if (refreshDecoded?.exp) {
        TokenStore.saveRefreshToken(nextRefreshToken, user.id, refreshDecoded.exp * 1000);
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken: nextRefreshToken
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to refresh token'
      });
    }
  }

  // Start password reset flow
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Email is required'
        });
      }

      const userRepository = new UserRepositoryImpl();
      const user = await userRepository.findByEmail(email);

      // Do not leak user existence
      if (!user) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: 'If the email exists, a password reset link/token has been generated.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000;
      TokenStore.savePasswordResetToken(resetToken, user.id, expiresAt);

      const response = {
        success: true,
        message: 'If the email exists, a password reset link/token has been generated.'
      };
      if (env.NODE_ENV !== 'production') {
        response.data = { resetToken, expiresAt };
      }

      return res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create password reset token'
      });
    }
  }

  // Reset password with token
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body || {};
      if (!token || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Token and newPassword are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const resetTokenData = TokenStore.consumePasswordResetToken(token);
      if (!resetTokenData) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const userRepository = new UserRepositoryImpl();
      const user = await userRepository.findById(resetTokenData.userId);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }

      const passwordHash = await PasswordHasher.hash(newPassword);
      await userRepository.update(user.id, { passwordHash });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Password reset failed'
      });
    }
  }

  // Get current user profile (requires authentication)
  static async getProfile(req, res) {
    try {
      // User is attached to req by authMiddleware
      const user = req.user;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: user.toPublicJSON()
        }
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get profile'
      });
    }
  }

  // Alias for /api/auth/me
  static async me(req, res) {
    return AuthController.getProfile(req, res);
  }

  // OAuth start endpoint for Google
  static async googleOAuth(req, res) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CALLBACK_URL.'
      });
    }

    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { authUrl: `${baseUrl}?${params.toString()}` },
      message: 'Open authUrl in browser to continue Google OAuth login'
    });
  }

  // Google OAuth callback endpoint
  static async googleOAuthCallback(req, res) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing OAuth code'
        });
      }

      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Google OAuth is not fully configured.'
        });
      }

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      });

      const googleAccessToken = tokenResponse.data.access_token;
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });

      const email = userInfoResponse.data?.email;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Google account email not available'
        });
      }

      const userRepository = new UserRepositoryImpl();
      let user = await userRepository.findByEmail(email);

      if (!user) {
        const randomPassword = crypto.randomBytes(24).toString('hex');
        const passwordHash = await PasswordHasher.hash(randomPassword);
        user = await userRepository.create({
          email,
          passwordHash,
          role: 'STUDENT',
          isActive: true
        });
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role.toString()
      };
      const token = JWTService.generateToken(payload);
      const refreshToken = JWTService.generateRefreshToken(payload);
      const refreshDecoded = JWTService.decodeToken(refreshToken);
      if (refreshDecoded?.exp) {
        TokenStore.saveRefreshToken(refreshToken, user.id, refreshDecoded.exp * 1000);
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: user.toPublicJSON(),
          token,
          refreshToken
        },
        message: 'Google OAuth login successful'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'Google OAuth login failed'
      });
    }
  }

  // OAuth start endpoint for LinkedIn
  static async linkedInOAuth(req, res) {
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CALLBACK_URL) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CALLBACK_URL.'
      });
    }

    const baseUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.LINKEDIN_CLIENT_ID,
      redirect_uri: env.LINKEDIN_CALLBACK_URL,
      scope: 'openid profile email'
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { authUrl: `${baseUrl}?${params.toString()}` },
      message: 'Open authUrl in browser to continue LinkedIn OAuth login'
    });
  }

  // LinkedIn OAuth callback endpoint
  static async linkedInOAuthCallback(req, res) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing OAuth code'
        });
      }

      if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET || !env.LINKEDIN_CALLBACK_URL) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'LinkedIn OAuth is not fully configured.'
        });
      }

      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          client_id: env.LINKEDIN_CLIENT_ID,
          client_secret: env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: env.LINKEDIN_CALLBACK_URL
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const linkedInAccessToken = tokenResponse.data.access_token;
      const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${linkedInAccessToken}` }
      });

      const email = userInfoResponse.data?.email;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'LinkedIn account email not available'
        });
      }

      const userRepository = new UserRepositoryImpl();
      let user = await userRepository.findByEmail(email);

      if (!user) {
        const randomPassword = crypto.randomBytes(24).toString('hex');
        const passwordHash = await PasswordHasher.hash(randomPassword);
        user = await userRepository.create({
          email,
          passwordHash,
          role: 'STUDENT',
          isActive: true
        });
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role.toString()
      };
      const token = JWTService.generateToken(payload);
      const refreshToken = JWTService.generateRefreshToken(payload);
      const refreshDecoded = JWTService.decodeToken(refreshToken);
      if (refreshDecoded?.exp) {
        TokenStore.saveRefreshToken(refreshToken, user.id, refreshDecoded.exp * 1000);
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: user.toPublicJSON(),
          token,
          refreshToken
        },
        message: 'LinkedIn OAuth login successful'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'LinkedIn OAuth login failed'
      });
    }
  }
}

