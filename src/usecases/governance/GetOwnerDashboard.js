import { GovernanceMetricsRepositoryImpl } from '../../repositories/GovernanceMetricsRepositoryImpl.js';
import { AuditLogRepositoryImpl } from '../../repositories/AuditLogRepositoryImpl.js';

export class GetOwnerDashboard {
  constructor(metricsRepository = null, auditLogRepository = null) {
    this.metricsRepository = metricsRepository || new GovernanceMetricsRepositoryImpl();
    this.auditLogRepository = auditLogRepository || new AuditLogRepositoryImpl();
  }

  async execute({ ownerId, recentAuditLimit = 10 } = {}) {
    const managedUserIds = await this.metricsRepository.getManagedUserIds(ownerId);
    const [statistics, recentActivity] = await Promise.all([
      this.metricsRepository.getOwnerStatistics(ownerId),
      this.auditLogRepository.findRecentForOwner(ownerId, managedUserIds, recentAuditLimit)
    ]);

    return {
      statistics,
      recentActivity
    };
  }
}
