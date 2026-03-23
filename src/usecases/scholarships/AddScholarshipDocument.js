import { ScholarshipRepositoryImpl } from '../../repositories/ScholarshipRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { canManageScholarship } from './helpers.js';

export class AddScholarshipDocument {
  constructor(scholarshipRepository = null) {
    this.scholarshipRepository = scholarshipRepository || new ScholarshipRepositoryImpl();
  }

  async execute({ actor, scholarshipId, file }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER].includes(actorRole)) {
      throw new Error('Only admin, owner, or manager can upload scholarship documents');
    }

    const scholarship = await this.scholarshipRepository.findById(scholarshipId);
    if (!scholarship || !scholarship.isActive) {
      throw new Error('Scholarship not found');
    }
    if (!canManageScholarship(actor, scholarship)) {
      throw new Error('Insufficient permissions');
    }
    if (!file) {
      throw new Error('Document file is required');
    }

    return this.scholarshipRepository.addDocument({
      scholarshipId,
      fileName: file.originalname,
      fileUrl: `/uploads/scholarship-documents/${file.filename}`,
      mimeType: file.mimetype,
      uploadedById: actor.id
    });
  }
}

