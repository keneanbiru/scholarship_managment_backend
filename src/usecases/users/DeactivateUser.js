import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';

export class DeactivateUser {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, userId }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can deactivate users');
    }

    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(userId);
    return { message: 'User deactivated successfully' };
  }
}

