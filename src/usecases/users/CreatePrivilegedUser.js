import { RegisterUser } from '../auth/RegisterUser.js';
import { ROLES } from '../../config/constants.js';

export class CreatePrivilegedUser {
  constructor(registerUser = null) {
    this.registerUser = registerUser || new RegisterUser();
  }

  async createOwner({ actor, email, password }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can create owner accounts');
    }

    return this.registerUser.execute({
      email,
      password,
      role: ROLES.OWNER,
      allowPrivilegedRoleCreation: true,
      createdById: actor.id
    });
  }

  async createManager({ actor, email, password }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER].includes(actorRole)) {
      throw new Error('Only admin or owner can create manager accounts');
    }

    return this.registerUser.execute({
      email,
      password,
      role: ROLES.MANAGER,
      allowPrivilegedRoleCreation: true,
      createdById: actor.id
    });
  }
}

