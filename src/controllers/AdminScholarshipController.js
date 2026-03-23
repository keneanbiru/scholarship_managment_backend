import { HTTP_STATUS } from '../config/constants.js';
import { ListPendingScholarships } from '../usecases/scholarships/ListPendingScholarships.js';
import { VerifyScholarship } from '../usecases/scholarships/VerifyScholarship.js';
import { RejectScholarship } from '../usecases/scholarships/RejectScholarship.js';
import { FlagScholarship } from '../usecases/scholarships/FlagScholarship.js';

export class AdminScholarshipController {
  static async listPending(req, res) {
    try {
      const usecase = new ListPendingScholarships();
      const result = await usecase.execute({
        actor: req.user,
        page: parseInt(req.query.page || '1', 10),
        limit: parseInt(req.query.limit || '20', 10)
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
    }
  }

  static async verify(req, res) {
    try {
      const usecase = new VerifyScholarship();
      const scholarship = await usecase.execute({ actor: req.user, scholarshipId: req.params.id });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async reject(req, res) {
    try {
      const usecase = new RejectScholarship();
      const scholarship = await usecase.execute({
        actor: req.user,
        scholarshipId: req.params.id,
        reason: req.body?.reason || ''
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async flag(req, res) {
    try {
      const usecase = new FlagScholarship();
      const scholarship = await usecase.execute({
        actor: req.user,
        scholarshipId: req.params.id,
        reason: req.body?.reason || ''
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

