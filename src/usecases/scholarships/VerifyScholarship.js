import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { NotificationRepositoryImpl } from '../../repositories/NotificationRepositoryImpl.js';
import { ROLES, SCHOLARSHIP_STATUS } from '../../config/constants.js';

export class VerifyScholarship {
  constructor(scholarshipRepository = null, notificationRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
    this.notificationRepository = notificationRepository || new NotificationRepositoryImpl();
  }

  async execute({ actor, scholarshipId }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can verify scholarships');
    }

    const scholarship = await this.scholarshipRepository.findById(scholarshipId);
    if (!scholarship || !scholarship.isActive) {
      throw new Error('Scholarship not found');
    }
    if (scholarship.status === SCHOLARSHIP_STATUS.EXPIRED) {
      throw new Error('Cannot verify expired scholarship');
    }

    const updated = await this.scholarshipRepository.updateVerificationStatus({
      scholarshipId,
      status: SCHOLARSHIP_STATUS.VERIFIED,
      verifiedById: actor.id
    });

    await this.notificationRepository.create({
      userId: scholarship.createdById,
      title: 'Scholarship verified',
      message: `"${scholarship.title}" has been verified by admin.`
    });

    return updated;
  }
}

