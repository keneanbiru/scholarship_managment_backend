import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { AdminController } from '../controllers/AdminController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

router.get('/dashboard', AdminController.dashboard);
router.get('/statistics', AdminController.statistics);
router.get('/users', AdminController.users);
router.get('/audit-logs', AdminController.auditLogs);

export default router;
