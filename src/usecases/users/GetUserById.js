import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { canManageUserScope } from './permissions.js';

export class GetUserById {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, userId }) {
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    const hasAccess = [ROLES.ADMIN, ROLES.OWNER].includes(actorRole)
      ? canManageUserScope(actor, target)
      : actor.id === target.id;

    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return target.toPublicJSON();
  }
}

