import { AuditLogRepositoryImpl } from '../../repositories/AuditLogRepositoryImpl.js';

export class RecordAuditEvent {
  constructor(auditLogRepository = null) {
    this.auditLogRepository = auditLogRepository || new AuditLogRepositoryImpl();
  }

  /**
   * Persists an audit entry. Never throws — failures are logged only.
   */
  async execute({ actorUserId, action, entityType = 'USER', entityId, details, ip, userAgent }) {
    try {
      await this.auditLogRepository.create({
        actorUserId,
        action,
        entityType,
        entityId,
        details,
        ip,
        userAgent
      });
    } catch (err) {
      console.error('[AuditLog] Failed to record event:', err.message);
    }
  }
}
