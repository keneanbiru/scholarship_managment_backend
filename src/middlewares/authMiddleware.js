import { JWTService } from '../infrastructure/auth/jwtService.js';
import { TokenStore } from '../infrastructure/auth/tokenStore.js';
import { UserRepositoryImpl } from '../repositories/UserRepositoryImpl.js';
import { HTTP_STATUS } from '../config/constants.js';

// Authentication Middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided. Authorization required.'
      });
    }

    // Verify token
    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    if (TokenStore.isAccessTokenBlacklisted(token)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token is invalidated. Please login again.'
      });
    }

    // Fetch user from database
    const userRepository = new UserRepositoryImpl();
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role.toString();

    next();
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication error: ' + error.message
    });
  }
};

