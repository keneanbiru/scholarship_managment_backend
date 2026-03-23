import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';
import { canOwnerTouchTarget } from './permissions.js';
import { RecordAuditEvent } from '../governance/RecordAuditEvent.js';

export class SetUserActiveStatus {
  constructor(userRepository = null, recordAuditEvent = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
    this.recordAuditEvent = recordAuditEvent || new RecordAuditEvent();
  }

  async execute({ actor, userId, isActive, auditContext }) {
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const actorRole = actor.role.toString();
    if (actorRole === ROLES.ADMIN) {
      const updated = await this.userRepository.update(userId, { isActive });
      await this.recordAuditEvent.execute({
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.USER_ACTIVE_STATUS_CHANGED,
        entityId: userId,
        details: { isActive, previousIsActive: target.isActive },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });
      return updated.toPublicJSON();
    }

    if (actorRole === ROLES.OWNER && target.createdById === actor.id && canOwnerTouchTarget(target)) {
      const updated = await this.userRepository.update(userId, { isActive });
      await this.recordAuditEvent.execute({
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.USER_ACTIVE_STATUS_CHANGED,
        entityId: userId,
        details: { isActive, previousIsActive: target.isActive },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });
      return updated.toPublicJSON();
    }

    throw new Error('Insufficient permissions');
  }
}

