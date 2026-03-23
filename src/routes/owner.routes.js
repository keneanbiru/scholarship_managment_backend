import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { OwnerController } from '../controllers/OwnerController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.OWNER]));

router.get('/dashboard', OwnerController.dashboard);
router.get('/statistics', OwnerController.statistics);

export default router;
