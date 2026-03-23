import express from 'express';
import { ScholarshipController } from '../controllers/ScholarshipController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { scholarshipDocumentUpload } from '../middlewares/uploadMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', ScholarshipController.list);
router.get('/my-scholarships', authMiddleware, roleMiddleware([ROLES.OWNER, ROLES.MANAGER]), ScholarshipController.listMy);
router.post('/', authMiddleware, roleMiddleware([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]), ScholarshipController.create);
router.put('/:id', authMiddleware, roleMiddleware([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]), ScholarshipController.update);
router.delete('/:id', authMiddleware, roleMiddleware([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]), ScholarshipController.remove);
router.put('/:id/submit', authMiddleware, roleMiddleware([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]), ScholarshipController.submitForReview);
router.post(
  '/:id/documents',
  authMiddleware,
  roleMiddleware([ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER]),
  scholarshipDocumentUpload.single('file'),
  ScholarshipController.addDocument
);
router.get('/:id', ScholarshipController.getById);

export default router;

