import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import crypto from 'crypto';

// JWT Service for token generation and verification
export class JWTService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload (usually { userId, email, role })
   * @returns {string} - JWT token
   */
  static generateToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
  }

  /**
   * Generate refresh token
   * @param {Object} payload
   * @returns {string}
   */
  static generateRefreshToken(payload) {
    const refreshPayload = {
      ...payload,
      jti: crypto.randomUUID()
    };
    return jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });
  }

  /**
   * Verify and decode token
   * @param {string} token - JWT token
   * @returns {Object|null} - Decoded payload or null if invalid
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify and decode refresh token
   * @param {string} token
   * @returns {Object|null}
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without validation to read exp claim
   * @param {string} token
   * @returns {Object|null}
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header (format: "Bearer <token>")
   * @returns {string|null} - Token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }
}

