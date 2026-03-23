import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { canManageScholarship } from './helpers.js';

export class DeleteScholarship {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, scholarshipId }) {
    const existing = await this.scholarshipRepository.findById(scholarshipId);
    if (!existing || !existing.isActive) {
      throw new Error('Scholarship not found');
    }

    if (!canManageScholarship(actor, existing)) {
      throw new Error('Insufficient permissions');
    }

    const hasApplications = await this.scholarshipRepository.hasApplications(scholarshipId);
    if (hasApplications) {
      await this.scholarshipRepository.update(scholarshipId, { status: 'EXPIRED', isActive: false });
      return { message: 'Scholarship archived because applications exist' };
    }

    await this.scholarshipRepository.softDelete(scholarshipId);
    return { message: 'Scholarship deleted successfully' };
  }
}

