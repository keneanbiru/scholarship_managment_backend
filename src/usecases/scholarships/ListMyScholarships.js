import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { getOwnershipScopeWhere } from './helpers.js';

export class ListMyScholarships {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, page = 1, limit = 20, search = '', status }) {
    const actorRole = actor.role.toString();
    if (![ROLES.OWNER, ROLES.MANAGER].includes(actorRole)) {
      throw new Error('Only owner or manager can access my scholarships');
    }

    const query = { page, limit, search, status };
    if (actorRole === ROLES.MANAGER) {
      query.createdById = actor.id;
    } else {
      query.scopeWhere = getOwnershipScopeWhere(actor);
    }
    return this.scholarshipRepository.list(query);
  }
}

