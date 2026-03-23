import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES, SCHOLARSHIP_STATUS } from '../../config/constants.js';

export class ListScholarships {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor = null, page = 1, limit = 20, search = '', status, country }) {
    const query = { page, limit, search, status, country };
    // By default, public/students only see verified scholarships unless status is explicitly requested.
    if (!status) {
      const actorRole = actor?.role?.toString?.();
      if (!actorRole || actorRole === ROLES.STUDENT) {
        query.status = SCHOLARSHIP_STATUS.VERIFIED;
      }
    }
    if (actor && actor.role.toString() === ROLES.MANAGER) {
      query.createdById = actor.id;
    }
    return this.scholarshipRepository.list(query);
  }
}

