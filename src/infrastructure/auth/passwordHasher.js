import bcrypt from 'bcrypt';

// Password hashing service
export class PasswordHasher {
  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  static async hash(password) {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare plain password with hashed password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if passwords match
   */
  static async compare(password, hash) {
    if (!password || !hash) {
      return false;
    }
    
    return await bcrypt.compare(password, hash);
  }
}

