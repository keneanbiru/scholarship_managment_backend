import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';
import { RecordAuditEvent } from '../governance/RecordAuditEvent.js';

export class DeactivateUser {
  constructor(userRepository = null, recordAuditEvent = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
    this.recordAuditEvent = recordAuditEvent || new RecordAuditEvent();
  }

  async execute({ actor, userId, auditContext }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can deactivate users');
    }

    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(userId);

    await this.recordAuditEvent.execute({
      actorUserId: actor.id,
      action: AUDIT_ACTIONS.USER_DEACTIVATED,
      entityId: userId,
      details: { email: target.email, role: target.role.toString() },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent
    });

    return { message: 'User deactivated successfully' };
  }
}

