import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { Role } from '../../domain/valueObjects/Role.js';
import { ROLES } from '../../config/constants.js';
import { canOwnerAssignRole, canOwnerTouchTarget } from './permissions.js';

export class ChangeUserRole {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, userId, role }) {
    const nextRole = new Role(role).toString();
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    if (actorRole === ROLES.ADMIN) {
      const updated = await this.userRepository.update(userId, { role: nextRole });
      return updated.toPublicJSON();
    }

    if (
      actorRole === ROLES.OWNER &&
      target.createdById === actor.id &&
      canOwnerTouchTarget(target) &&
      canOwnerAssignRole(nextRole)
    ) {
      const updated = await this.userRepository.update(userId, { role: nextRole });
      return updated.toPublicJSON();
    }

    throw new Error('Insufficient permissions');
  }
}

