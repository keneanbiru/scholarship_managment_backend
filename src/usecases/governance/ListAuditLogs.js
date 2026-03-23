import { AuditLogRepositoryImpl } from '../../repositories/AuditLogRepositoryImpl.js';
import { AUDIT_ACTIONS } from '../../config/constants.js';

export class ListAuditLogs {
  constructor(auditLogRepository = null) {
    this.auditLogRepository = auditLogRepository || new AuditLogRepositoryImpl();
  }

  async execute({ page, limit, actorUserId, action, from, to }) {
    if (action && !Object.values(AUDIT_ACTIONS).includes(action)) {
      throw new Error(`Invalid action. Use one of: ${Object.keys(AUDIT_ACTIONS).join(', ')}`);
    }
    return this.auditLogRepository.list({
      page,
      limit,
      actorUserId,
      action,
      from,
      to
    });
  }
}
