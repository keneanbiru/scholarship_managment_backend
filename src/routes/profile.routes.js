import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { ProfileController } from '../controllers/ProfileController.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.STUDENT]));

router.post('/', ProfileController.create);
router.get('/', ProfileController.getSelf);
router.put('/', ProfileController.updateSelf);

export default router;

