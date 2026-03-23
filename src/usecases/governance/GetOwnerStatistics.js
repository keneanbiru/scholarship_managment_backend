import { GovernanceMetricsRepositoryImpl } from '../../repositories/GovernanceMetricsRepositoryImpl.js';

export class GetOwnerStatistics {
  constructor(metricsRepository = null) {
    this.metricsRepository = metricsRepository || new GovernanceMetricsRepositoryImpl();
  }

  async execute({ ownerId }) {
    return this.metricsRepository.getOwnerStatistics(ownerId);
  }
}
