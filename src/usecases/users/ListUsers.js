import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';

export class ListUsers {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, page = 1, limit = 20, search = '', role = null }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER].includes(actorRole)) {
      throw new Error('Only admin or owner can list users');
    }

    const query = { page, limit, search, role };
    if (actorRole === ROLES.OWNER) {
      query.createdById = actor.id;
    }

    const result = await this.userRepository.listUsers(query);
    return {
      users: result.users.map((user) => user.toPublicJSON()),
      pagination: result.pagination
    };
  }
}

