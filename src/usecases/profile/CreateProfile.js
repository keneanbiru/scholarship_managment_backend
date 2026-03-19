import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { calculateProfileCompleteness, validateProfileInput } from './helpers.js';

export class CreateProfile {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, data }) {
    if (actor.role.toString() !== ROLES.STUDENT) {
      throw new Error('Only students can create profile');
    }

    const existing = await this.userRepository.findProfileByUserId(actor.id);
    if (existing) {
      throw new Error('Profile already exists');
    }

    validateProfileInput(data, false);
    const profile = await this.userRepository.createProfile({
      userId: actor.id,
      fullName: data.fullName,
      university: data.university || 'N/A',
      fieldOfStudy: data.fieldOfStudy,
      currentEducationLevel: data.currentEducationLevel,
      targetEducationLevels: data.targetEducationLevels,
      gpa: data.gpa ?? null,
      country: data.country,
      preferredLang: data.preferredLang
    });

    return {
      ...profile,
      profileCompleteness: calculateProfileCompleteness(profile)
    };
  }
}

