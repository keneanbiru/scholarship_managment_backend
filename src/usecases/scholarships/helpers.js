import {
  ROLES,
  FUNDING_TYPES,
  SCHOLARSHIP_TYPES,
  SCHOLARSHIP_STATUS,
  EDUCATION_LEVELS
} from '../../config/constants.js';

export const assertScholarshipInput = (data, partial = false) => {
  const requiredFields = [
    'title',
    'provider',
    'country',
    'targetEducationLevels',
    'scholarshipType',
    'fieldOfStudy',
    'fundingType',
    'deadline',
    'officialLink',
    'description'
  ];

  if (!partial) {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new Error(`${field} is required`);
      }
    }
  }

  if (data.fundingType !== undefined && !Object.values(FUNDING_TYPES).includes(data.fundingType)) {
    throw new Error('Invalid fundingType');
  }

  if (data.scholarshipType !== undefined && !Object.values(SCHOLARSHIP_TYPES).includes(data.scholarshipType)) {
    throw new Error('Invalid scholarshipType');
  }

  if (data.status !== undefined && !Object.values(SCHOLARSHIP_STATUS).includes(data.status)) {
    throw new Error('Invalid status');
  }

  if (data.targetEducationLevels !== undefined) {
    if (!Array.isArray(data.targetEducationLevels) || data.targetEducationLevels.length === 0) {
      throw new Error('targetEducationLevels must be a non-empty array');
    }
    const invalid = data.targetEducationLevels.find((level) => !Object.values(EDUCATION_LEVELS).includes(level));
    if (invalid) {
      throw new Error(`Invalid targetEducationLevel: ${invalid}`);
    }
  }

  if (data.deadline !== undefined) {
    const deadline = new Date(data.deadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new Error('Invalid deadline');
    }
    if (deadline.getTime() <= Date.now()) {
      throw new Error('Deadline must be in the future');
    }
  }

  if (data.officialLink !== undefined) {
    try {
      const url = new URL(data.officialLink);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new Error('Invalid officialLink URL');
    }
  }
};

export const getOwnershipScopeWhere = (actor) => {
  const role = actor.role.toString();
  if (role === ROLES.ADMIN) {
    return null;
  }
  if (role === ROLES.OWNER) {
    return {
      OR: [
        { createdById: actor.id },
        { createdBy: { createdById: actor.id } }
      ]
    };
  }
  if (role === ROLES.MANAGER) {
    return { createdById: actor.id };
  }
  throw new Error('Insufficient permissions');
};

export const canManageScholarship = (actor, scholarship) => {
  const role = actor.role.toString();
  if (role === ROLES.ADMIN) {
    return true;
  }
  if (role === ROLES.MANAGER) {
    return scholarship.createdById === actor.id;
  }
  if (role === ROLES.OWNER) {
    return scholarship.createdById === actor.id || scholarship.createdBy?.createdById === actor.id;
  }
  return false;
};

