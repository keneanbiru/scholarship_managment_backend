import { RegisterUser } from '../auth/RegisterUser.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';
import { RecordAuditEvent } from '../governance/RecordAuditEvent.js';

export class CreatePrivilegedUser {
  constructor(registerUser = null, recordAuditEvent = null) {
    this.registerUser = registerUser || new RegisterUser();
    this.recordAuditEvent = recordAuditEvent || new RecordAuditEvent();
  }

  async createOwner({ actor, email, password, auditContext }) {
    if (actor.role.toString() !== ROLES.ADMIN) {
      throw new Error('Only admin can create owner accounts');
    }

    const result = await this.registerUser.execute({
      email,
      password,
      role: ROLES.OWNER,
      allowPrivilegedRoleCreation: true,
      createdById: actor.id
    });

    await this.recordAuditEvent.execute({
      actorUserId: actor.id,
      action: AUDIT_ACTIONS.OWNER_CREATED,
      entityId: result.user.id,
      details: { email: result.user.email },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent
    });

    return result;
  }

  async createManager({ actor, email, password, auditContext }) {
    const actorRole = actor.role.toString();
    if (![ROLES.ADMIN, ROLES.OWNER].includes(actorRole)) {
      throw new Error('Only admin or owner can create manager accounts');
    }

    const result = await this.registerUser.execute({
      email,
      password,
      role: ROLES.MANAGER,
      allowPrivilegedRoleCreation: true,
      createdById: actor.id
    });

    await this.recordAuditEvent.execute({
      actorUserId: actor.id,
      action: AUDIT_ACTIONS.MANAGER_CREATED,
      entityId: result.user.id,
      details: { email: result.user.email },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent
    });

    return result;
  }
}

