import { HTTP_STATUS } from '../config/constants.js';
import { CreateScholarship } from '../usecases/scholarships/CreateScholarship.js';
import { UpdateScholarship } from '../usecases/scholarships/UpdateScholarship.js';
import { DeleteScholarship } from '../usecases/scholarships/DeleteScholarship.js';
import { GetScholarshipById } from '../usecases/scholarships/GetScholarshipById.js';
import { ListScholarships } from '../usecases/scholarships/ListScholarships.js';
import { ListMyScholarships } from '../usecases/scholarships/ListMyScholarships.js';
import { AddScholarshipDocument } from '../usecases/scholarships/AddScholarshipDocument.js';
import { SubmitScholarshipForReview } from '../usecases/scholarships/SubmitScholarshipForReview.js';

export class ScholarshipController {
  static async create(req, res) {
    try {
      const usecase = new CreateScholarship();
      const scholarship = await usecase.execute({ actor: req.user, data: req.body || {} });
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: { scholarship } });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const usecase = new UpdateScholarship();
      const scholarship = await usecase.execute({
        actor: req.user,
        scholarshipId: req.params.id,
        data: req.body || {}
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const usecase = new DeleteScholarship();
      const result = await usecase.execute({ actor: req.user, scholarshipId: req.params.id });
      return res.status(HTTP_STATUS.OK).json({ success: true, message: result.message });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.FORBIDDEN;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const usecase = new GetScholarshipById();
      const scholarship = await usecase.execute({ scholarshipId: req.params.id });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async list(req, res) {
    try {
      const usecase = new ListScholarships();
      const result = await usecase.execute({
        actor: req.user || null,
        page: parseInt(req.query.page || '1', 10),
        limit: parseInt(req.query.limit || '20', 10),
        search: req.query.search || '',
        status: req.query.status || undefined,
        country: req.query.country || undefined
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  static async listMy(req, res) {
    try {
      const usecase = new ListMyScholarships();
      const result = await usecase.execute({
        actor: req.user,
        page: parseInt(req.query.page || '1', 10),
        limit: parseInt(req.query.limit || '20', 10),
        search: req.query.search || '',
        status: req.query.status || undefined
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
    }
  }

  static async addDocument(req, res) {
    try {
      const usecase = new AddScholarshipDocument();
      const document = await usecase.execute({
        actor: req.user,
        scholarshipId: req.params.id,
        file: req.file
      });
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: { document } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async submitForReview(req, res) {
    try {
      const usecase = new SubmitScholarshipForReview();
      const scholarship = await usecase.execute({
        actor: req.user,
        scholarshipId: req.params.id
      });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { scholarship } });
    } catch (error) {
      const status = error.message === 'Scholarship not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

