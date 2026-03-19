import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES } from '../../config/constants.js';
import { calculateProfileCompleteness } from './helpers.js';

export class GetProfile {
  constructor(userRepository = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
  }

  async execute({ actor }) {
    if (actor.role.toString() !== ROLES.STUDENT) {
      throw new Error('Only students can access student profile');
    }

    const profile = await this.userRepository.findProfileByUserId(actor.id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      profileCompleteness: calculateProfileCompleteness(profile)
    };
  }
}

