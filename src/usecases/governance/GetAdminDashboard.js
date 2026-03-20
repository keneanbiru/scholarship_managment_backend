import { GovernanceMetricsRepositoryImpl } from '../../repositories/GovernanceMetricsRepositoryImpl.js';
import { AuditLogRepositoryImpl } from '../../repositories/AuditLogRepositoryImpl.js';

export class GetAdminDashboard {
  constructor(metricsRepository = null, auditLogRepository = null) {
    this.metricsRepository = metricsRepository || new GovernanceMetricsRepositoryImpl();
    this.auditLogRepository = auditLogRepository || new AuditLogRepositoryImpl();
  }

  async execute({ recentAuditLimit = 10 } = {}) {
    const [statistics, recentActivity] = await Promise.all([
      this.metricsRepository.getAdminStatistics(),
      this.auditLogRepository.findRecentForAdmin(recentAuditLimit)
    ]);

    return {
      statistics,
      recentActivity
    };
  }
}
