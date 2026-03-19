import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { canOwnerTouchTarget } from './permissions.js';

export class SetUserActiveStatus {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, userId, isActive }) {
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    if (actorRole === ROLES.ADMIN) {
      const updated = await this.userRepository.update(userId, { isActive });
      return updated.toPublicJSON();
    }

    if (actorRole === ROLES.OWNER && target.createdById === actor.id && canOwnerTouchTarget(target)) {
      const updated = await this.userRepository.update(userId, { isActive });
      return updated.toPublicJSON();
    }

    throw new Error('Insufficient permissions');
  }
}

