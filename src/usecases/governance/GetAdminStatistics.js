import { GovernanceMetricsRepositoryImpl } from '../../repositories/GovernanceMetricsRepositoryImpl.js';

export class GetAdminStatistics {
  constructor(metricsRepository = null) {
    this.metricsRepository = metricsRepository || new GovernanceMetricsRepositoryImpl();
  }

  async execute() {
    return this.metricsRepository.getAdminStatistics();
  }
}
