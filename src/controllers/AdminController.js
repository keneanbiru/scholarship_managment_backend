import { HTTP_STATUS } from '../config/constants.js';
import { ListUsers } from '../usecases/users/ListUsers.js';
import { GetAdminDashboard } from '../usecases/governance/GetAdminDashboard.js';
import { GetAdminStatistics } from '../usecases/governance/GetAdminStatistics.js';
import { ListAuditLogs } from '../usecases/governance/ListAuditLogs.js';

export class AdminController {
  static async dashboard(req, res) {
    try {
      const usecase = new GetAdminDashboard();
      const data = await usecase.execute({
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
      const usecase = new GetAdminStatistics();
      const statistics = await usecase.execute();
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { statistics } });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Admin-scoped user listing (same rules as GET /api/users for ADMIN).
   */
  static async users(req, res) {
    try {
      const usecase = new ListUsers();
      const result = await usecase.execute({
        actor: req.user,
        page: parseInt(req.query.page || '1', 10),
        limit: parseInt(req.query.limit || '20', 10),
        search: req.query.search || '',
        role: req.query.role || null
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
    }
  }

  static async auditLogs(req, res) {
    try {
      const usecase = new ListAuditLogs();
      const result = await usecase.execute({
        page: parseInt(req.query.page || '1', 10),
        limit: parseInt(req.query.limit || '20', 10),
        actorUserId: req.query.actorUserId || undefined,
        action: req.query.action || undefined,
        from: req.query.from || undefined,
        to: req.query.to || undefined
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }
}
