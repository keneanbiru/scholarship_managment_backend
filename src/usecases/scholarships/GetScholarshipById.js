import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';

export class GetScholarshipById {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ scholarshipId }) {
    const scholarship = await this.scholarshipRepository.findById(scholarshipId);
    if (!scholarship || !scholarship.isActive) {
      throw new Error('Scholarship not found');
    }
    return scholarship;
  }
}

