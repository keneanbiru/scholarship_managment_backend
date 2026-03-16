import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { PasswordHasher } from '../../infrastructure/auth/passwordHasher.js';
import { JWTService } from '../../infrastructure/auth/jwtService.js';
import { TokenStore } from '../../infrastructure/auth/tokenStore.js';

// Login User Use Case
export class LoginUser {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ email, password }) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await PasswordHasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.toString()
    };
    const token = JWTService.generateToken(tokenPayload);
    const refreshToken = JWTService.generateRefreshToken(tokenPayload);
    const refreshDecoded = JWTService.decodeToken(refreshToken);
    if (refreshDecoded?.exp) {
      TokenStore.saveRefreshToken(refreshToken, user.id, refreshDecoded.exp * 1000);
    }

    // Return user data and token
    return {
      user: user.toPublicJSON(),
      token,
      refreshToken,
      message: 'Login successful'
    };
  }
}

