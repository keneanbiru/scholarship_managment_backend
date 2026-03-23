import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { NotificationRepositoryImpl } from '../../repositories/NotificationRepositoryImpl.js';

export class ExpireScholarships {
  constructor(scholarshipRepository = null, notificationRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
    this.notificationRepository = notificationRepository || new NotificationRepositoryImpl();
  }

  async execute(now = new Date()) {
    const expirable = await this.scholarshipRepository.findExpirableScholarships(now);
    if (!expirable.length) {
      return { expiredCount: 0 };
    }

    const ids = expirable.map((s) => s.id);
    const updated = await this.scholarshipRepository.markExpiredByIds(ids);

    await Promise.all(
      expirable.map((scholarship) =>
        this.notificationRepository.create({
          userId: scholarship.createdById,
          title: 'Scholarship expired',
          message: `"${scholarship.title}" is now marked as expired because the deadline has passed.`
        })
      )
    );

    return { expiredCount: updated.count };
  }
}

