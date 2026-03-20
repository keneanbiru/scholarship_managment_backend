import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';
import { RecordAuditEvent } from '../governance/RecordAuditEvent.js';

export class UpdateUser {
  constructor(userRepository = null, recordAuditEvent = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
    this.recordAuditEvent = recordAuditEvent || new RecordAuditEvent();
  }

  async execute({ actor, userId, updates, auditContext }) {
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    const isSelf = actor.id === target.id;
    if (!isSelf && actorRole !== ROLES.ADMIN) {
      throw new Error('Only admin can update other users');
    }

    const safeUpdates = {};
    if (updates.email !== undefined) {
      safeUpdates.email = updates.email;
    }

    const updated = await this.userRepository.update(userId, safeUpdates);

    if (!isSelf && actorRole === ROLES.ADMIN && Object.keys(safeUpdates).length > 0) {
      await this.recordAuditEvent.execute({
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.USER_UPDATED_BY_ADMIN,
        entityId: userId,
        details: { fields: Object.keys(safeUpdates) },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });
    }

    return updated.toPublicJSON();
  }
}

