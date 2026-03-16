// UserRepository Interface (Domain Layer)
// This defines the contract that repository implementations must follow

export class UserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('findByEmail method must be implemented');
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>}
   */
  async create(userData) {
    throw new Error('create method must be implemented');
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<User>}
   */
  async update(id, updates) {
    throw new Error('update method must be implemented');
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   * @param {string} id - User ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('delete method must be implemented');
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    throw new Error('emailExists method must be implemented');
  }
}

