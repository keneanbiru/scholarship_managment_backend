import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';

export class ListPendingScholarships {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, page = 1, limit = 20 }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can view pending scholarships');
    }
    return this.scholarshipRepository.listPending({ page, limit });
  }
}

