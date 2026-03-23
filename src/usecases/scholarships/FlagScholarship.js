import { RejectScholarship } from './RejectScholarship.js';

export class FlagScholarship {
  constructor(rejectScholarship = null) {
    this.rejectScholarship = rejectScholarship || new RejectScholarship();
  }

  async execute({ actor, scholarshipId, reason = '' }) {
    const finalReason = reason?.trim() || 'Flagged by admin for quality/compliance review.';
    return this.rejectScholarship.execute({
      actor,
      scholarshipId,
      reason: finalReason
    });
  }
}

