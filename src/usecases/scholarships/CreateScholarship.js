import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES, SCHOLARSHIP_STATUS } from '../../config/constants.js';
import { assertScholarshipInput } from './helpers.js';

export class CreateScholarship {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, data }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(actorRole)) {
      throw new Error('Only admin, owner, or manager can create scholarships');
    }

    assertScholarshipInput(data, false);

    const scholarship = await this.scholarshipRepository.create({
      title: data.title.trim(),
      provider: data.provider.trim(),
      country: data.country.trim(),
      targetEducationLevels: data.targetEducationLevels,
      scholarshipType: data.scholarshipType,
      fieldOfStudy: data.fieldOfStudy.trim(),
      fundingType: data.fundingType,
      deadline: new Date(data.deadline),
      officialLink: data.officialLink,
      description: data.description,
      eligibilityCriteria: data.eligibilityCriteria || null,
      status: data.status || SCHOLARSHIP_STATUS.DRAFT,
      createdById: actor.id,
      ...(data.minAge !== undefined && { minAge: data.minAge }),
      ...(data.maxAge !== undefined && { maxAge: data.maxAge })
    });

    return scholarship;
  }
}

