import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { PasswordHasher } from '../../infrastructure/auth/passwordHasher.js';
import { Role } from '../../domain/valueObjects/Role.js';

// Register User Use Case
export class RegisterUser {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ email, password, role = 'STUDENT', allowPrivilegedRoleCreation = false }) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Validate role
    const userRole = new Role(role);
    if (!allowPrivilegedRoleCreation && userRole.toString() !== Role.STUDENT.toString()) {
      throw new Error('Public registration is only allowed for STUDENT role');
    }

    // Hash password
    const passwordHash = await PasswordHasher.hash(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      passwordHash,
      role: userRole.toString(),
      isActive: true
    });

    // Return user without password hash
    return {
      user: user.toPublicJSON(),
      message: 'User registered successfully. Please verify your email.'
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

