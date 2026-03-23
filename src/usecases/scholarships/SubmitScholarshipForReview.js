import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES, SCHOLARSHIP_STATUS } from '../../config/constants.js';
import { canManageScholarship } from './helpers.js';

export class SubmitScholarshipForReview {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, scholarshipId }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(actorRole)) {
      throw new Error('Only admin, owner, or manager can submit scholarship for review');
    }

    const scholarship = await this.scholarshipRepository.findById(scholarshipId);
    if (!scholarship || !scholarship.isActive) {
      throw new Error('Scholarship not found');
    }
    if (!canManageScholarship(actor, scholarship)) {
      throw new Error('Insufficient permissions');
    }
    if (scholarship.status === SCHOLARSHIP_STATUS.EXPIRED) {
      throw new Error('Expired scholarship cannot be submitted');
    }

    return this.scholarshipRepository.update(scholarshipId, {
      status: SCHOLARSHIP_STATUS.PENDING
    });
  }
}

