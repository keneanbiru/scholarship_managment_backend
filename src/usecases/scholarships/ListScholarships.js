import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';

export class ListScholarships {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor = null, page = 1, limit = 20, search = '', status, country }) {
    const query = { page, limit, search, status, country };
    if (actor && actor.role.toString() === ROLES.MANAGER) {
      query.createdById = actor.id;
    }
    return this.scholarshipRepository.list(query);
  }
}

