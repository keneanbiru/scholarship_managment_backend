import { UserRepositoryImpl } from '../../repositories/UserRepositoryImpl.js';
import { Role } from '../../domain/valueObjects/Role.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';
import { canOwnerAssignRole, canOwnerTouchTarget } from './permissions.js';
import { RecordAuditEvent } from '../governance/RecordAuditEvent.js';

export class ChangeUserRole {
  constructor(userRepository = null, recordAuditEvent = null) {
    this.userRepository = userRepository || new UserRepositoryImpl();
    this.recordAuditEvent = recordAuditEvent || new RecordAuditEvent();
  }

  async execute({ actor, userId, role, auditContext }) {
    const nextRole = new Role(role).toString();
    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    const previousRole = target.role.toString();
    const actorRole = actor.role.toString();
    if (actorRole === ROLES.ADMIN) {
      const updated = await this.userRepository.update(userId, { role: nextRole });
      await this.recordAuditEvent.execute({
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        entityId: userId,
        details: { previousRole, nextRole },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });
      return updated.toPublicJSON();
    }

    if (
      actorRole === ROLES.OWNER &&
      target.createdById === actor.id &&
      canOwnerTouchTarget(target) &&
      canOwnerAssignRole(nextRole)
    ) {
      const updated = await this.userRepository.update(userId, { role: nextRole });
      await this.recordAuditEvent.execute({
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        entityId: userId,
        details: { previousRole, nextRole },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });
      return updated.toPublicJSON();
    }

    throw new Error('Insufficient permissions');
  }
}

