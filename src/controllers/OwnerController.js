import { HTTP_STATUS } from '../config/constants.js';
import { GetOwnerDashboard } from '../usecases/governance/GetOwnerDashboard.js';
import { GetOwnerStatistics } from '../usecases/governance/GetOwnerStatistics.js';

export class OwnerController {
  static async dashboard(req, res) {
    try {
      const usecase = new GetOwnerDashboard();
      const data = await usecase.execute({
        ownerId: req.user.id,
        recentAuditLimit: parseInt(req.query.recentLimit || '10', 10)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  static async statistics(req, res) {
    try {
      const usecase = new GetOwnerStatistics();
      const statistics = await usecase.execute({ ownerId: req.user.id });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { statistics } });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }
}
