import { HTTP_STATUS } from '../config/constants.js';
import { ListUsers } from '../usecases/users/ListUsers.js';
import { GetUserById } from '../usecases/users/GetUserById.js';
import { UpdateUser } from '../usecases/users/UpdateUser.js';
import { DeactivateUser } from '../usecases/users/DeactivateUser.js';
import { SetUserActiveStatus } from '../usecases/users/SetUserActiveStatus.js';
import { ChangeUserRole } from '../usecases/users/ChangeUserRole.js';
import { CreatePrivilegedUser } from '../usecases/users/CreatePrivilegedUser.js';

function buildAuditContext(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

export class UserController {
  static async listUsers(req, res) {
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

  static async getUserById(req, res) {
    try {
      const usecase = new GetUserById();
      const user = await usecase.execute({ actor: req.user, userId: req.params.id });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { user } });
    } catch (error) {
      const status = error.message === 'User not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const usecase = new UpdateUser();
      const user = await usecase.execute({
        actor: req.user,
        userId: req.params.id,
        updates: req.body || {},
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { user } });
    } catch (error) {
      const status = error.message === 'User not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async deactivateUser(req, res) {
    try {
      const usecase = new DeactivateUser();
      const result = await usecase.execute({
        actor: req.user,
        userId: req.params.id,
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, message: result.message });
    } catch (error) {
      const status = error.message === 'User not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async setUserActive(req, res) {
    try {
      if (typeof req.body?.isActive !== 'boolean') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'isActive must be a boolean'
        });
      }
      const usecase = new SetUserActiveStatus();
      const user = await usecase.execute({
        actor: req.user,
        userId: req.params.id,
        isActive: req.body.isActive,
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { user } });
    } catch (error) {
      const status = error.message === 'User not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async changeRole(req, res) {
    try {
      const usecase = new ChangeUserRole();
      const user = await usecase.execute({
        actor: req.user,
        userId: req.params.id,
        role: req.body?.role,
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { user } });
    } catch (error) {
      const status = error.message === 'User not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async createOwner(req, res) {
    try {
      const usecase = new CreatePrivilegedUser();
      const result = await usecase.createOwner({
        actor: req.user,
        email: req.body?.email,
        password: req.body?.password,
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: result, message: 'Owner created successfully' });
    } catch (error) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
    }
  }

  static async createManager(req, res) {
    try {
      const usecase = new CreatePrivilegedUser();
      const result = await usecase.createManager({
        actor: req.user,
        email: req.body?.email,
        password: req.body?.password,
        auditContext: buildAuditContext(req)
      });
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: result, message: 'Manager created successfully' });
    } catch (error) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
    }
  }
}

