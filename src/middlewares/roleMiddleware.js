import { HTTP_STATUS } from '../config/constants.js';

// Role-based Authorization Middleware
// Usage: roleMiddleware(['ADMIN']) or roleMiddleware(['OWNER', 'MANAGER', 'ADMIN'])
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by authMiddleware)
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user role
      const userRole = req.userRole || req.user.role?.toString();

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or ')
        });
      }

      next();
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Authorization error: ' + error.message
      });
    }
  };
};

