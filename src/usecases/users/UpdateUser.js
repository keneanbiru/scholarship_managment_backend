import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';

export class UpdateUser {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, userId, updates }) {
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    const isSelf = actor.id === target.id;
    if (!isSelf && actorRole !== ROLES.ADMIN) {
      throw new Error('Only admin can update other users');
    }

    const safeUpdates = {};
    if (updates.email !== undefined) {
      safeUpdates.email = updates.email;
    }

    const updated = await this.userRepository.update(userId, safeUpdates);
    return updated.toPublicJSON();
  }
}

