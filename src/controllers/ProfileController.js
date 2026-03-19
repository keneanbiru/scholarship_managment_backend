import { HTTP_STATUS } from '../config/constants.js';
import { CreateProfile } from '../usecases/profile/CreateProfile.js';
import { GetProfile } from '../usecases/profile/GetProfile.js';
import { UpdateProfile } from '../usecases/profile/UpdateProfile.js';

export class ProfileController {
  static async create(req, res) {
    try {
      const usecase = new CreateProfile();
      const profile = await usecase.execute({ actor: req.user, data: req.body || {} });
      return res.status(HTTP_STATUS.CREATED).json({ success: true, data: { profile } });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  static async getSelf(req, res) {
    try {
      const usecase = new GetProfile();
      const profile = await usecase.execute({ actor: req.user });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { profile } });
    } catch (error) {
      const status = error.message === 'Profile not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  static async updateSelf(req, res) {
    try {
      const usecase = new UpdateProfile();
      const profile = await usecase.execute({ actor: req.user, data: req.body || {} });
      return res.status(HTTP_STATUS.OK).json({ success: true, data: { profile } });
    } catch (error) {
      const status = error.message === 'Profile not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

