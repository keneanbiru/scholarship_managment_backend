import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { assertScholarshipInput, canManageScholarship } from './helpers.js';

export class UpdateScholarship {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, scholarshipId, data }) {
    const existing = await this.scholarshipRepository.findById(scholarshipId);
    if (!existing || !existing.isActive) {
      throw new Error('Scholarship not found');
    }

    if (!canManageScholarship(actor, existing)) {
      throw new Error('Insufficient permissions');
    }

    assertScholarshipInput(data, true);
    const updates = {};
    const allowedFields = [
      'title',
      'provider',
      'country',
      'targetEducationLevels',
      'scholarshipType',
      'fieldOfStudy',
      'fundingType',
      'officialLink',
      'description',
      'eligibilityCriteria',
      'status',
      'minAge',
      'maxAge'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }
    if (data.deadline !== undefined) {
      updates.deadline = new Date(data.deadline);
    }

    return this.scholarshipRepository.update(scholarshipId, updates);
  }
}

