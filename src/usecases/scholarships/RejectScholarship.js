import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { NotificationRepositoryImpl } from '../../repositories/NotificationRepositoryImpl.js';
import { ROLES, SCHOLARSHIP_STATUS } from '../../config/constants.js';

export class RejectScholarship {
  constructor(scholarshipRepository = null, notificationRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
    this.notificationRepository = notificationRepository || new NotificationRepositoryImpl();
  }

  async execute({ actor, scholarshipId, reason = '' }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can reject scholarships');
    }

    const scholarship = await this.scholarshipRepository.findById(scholarshipId);
    if (!scholarship || !scholarship.isActive) {
      throw new Error('Scholarship not found');
    }

    const updated = await this.scholarshipRepository.updateVerificationStatus({
      scholarshipId,
      status: SCHOLARSHIP_STATUS.REJECTED,
      verifiedById: actor.id
    });

    const reasonMessage = reason ? ` Reason: ${reason}` : '';
    await this.notificationRepository.create({
      userId: scholarship.createdById,
      title: 'Scholarship rejected',
      message: `"${scholarship.title}" has been rejected by admin.${reasonMessage}`
    });

    return updated;
  }
}

