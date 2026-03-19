import express from 'express';
import { UserController } from '../controllers/UserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/owners', roleMiddleware([ROLES.ADMIN]), UserController.createOwner);
router.post('/managers', roleMiddleware([ROLES.ADMIN, ROLES.OWNER]), UserController.createManager);
router.get('/', roleMiddleware([ROLES.ADMIN, ROLES.OWNER]), UserController.listUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', roleMiddleware([ROLES.ADMIN]), UserController.deactivateUser);
router.put('/:id/activate', roleMiddleware([ROLES.ADMIN, ROLES.OWNER]), UserController.setUserActive);
router.put('/:id/role', roleMiddleware([ROLES.ADMIN, ROLES.OWNER]), UserController.changeRole);

export default router;

