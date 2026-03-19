import { EDUCATION_LEVELS } from '../../config/constants.js';

const REQUIRED_FIELDS = [
  'fullName',
  'fieldOfStudy',
  'currentEducationLevel',
  'targetEducationLevels',
  'country',
  'preferredLang'
];

export const validateProfileInput = (data, partial = false) => {
  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new Error(`${field} is required`);
      }
    }
  }

  if (data.gpa !== undefined && data.gpa !== null && (data.gpa < 0 || data.gpa > 4)) {
    throw new Error('GPA must be between 0.0 and 4.0');
  }

  if (data.currentEducationLevel !== undefined && !Object.values(EDUCATION_LEVELS).includes(data.currentEducationLevel)) {
    throw new Error('Invalid currentEducationLevel');
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
};

export const calculateProfileCompleteness = (profile) => {
  const fields = [
    profile.fullName,
    profile.university,
    profile.fieldOfStudy,
    profile.currentEducationLevel,
    Array.isArray(profile.targetEducationLevels) && profile.targetEducationLevels.length > 0 ? 'ok' : null,
    profile.gpa !== null && profile.gpa !== undefined ? 'ok' : null,
    profile.country,
    profile.preferredLang
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

