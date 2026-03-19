import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { calculateProfileCompleteness, validateProfileInput } from './helpers.js';

export class UpdateProfile {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor, data }) {
    if (actor.role.toString() !== ROLES.STUDENT) {
      throw new Error('Only students can update student profile');
    }

    const existing = await this.userRepository.findProfileByUserId(actor.id);
    if (!existing) {
      throw new Error('Profile not found');
    }

    validateProfileInput(data, true);
    const profile = await this.userRepository.updateProfile(actor.id, data);
    return {
      ...profile,
      profileCompleteness: calculateProfileCompleteness(profile)
    };
  }
}

