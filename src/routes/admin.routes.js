import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';
import { AdminController } from '../controllers/AdminController.js';
import { AdminScholarshipController } from '../controllers/AdminScholarshipController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

router.get('/dashboard', AdminController.dashboard);
router.get('/statistics', AdminController.statistics);
router.get('/users', AdminController.users);
router.get('/audit-logs', AdminController.auditLogs);
router.get('/scholarships/pending', AdminScholarshipController.listPending);
router.put('/scholarships/:id/verify', AdminScholarshipController.verify);
router.put('/scholarships/:id/reject', AdminScholarshipController.reject);
router.post('/scholarships/:id/flag', AdminScholarshipController.flag);

export default router;
