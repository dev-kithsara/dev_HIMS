import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import {
  getActionOwnerIncidents,
  submitCorrectiveAction,
} from './correctiveAction.controller';

const router = Router();

router.get('/action-owner', authenticate, authorizeRoles('ACTION_OWNER'), getActionOwnerIncidents);
router.patch(
  '/:id/corrective-action',
  authenticate,
  authorizeRoles('ACTION_OWNER'),
  submitCorrectiveAction
);

export default router;
