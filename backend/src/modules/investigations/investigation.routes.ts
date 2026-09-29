import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import { getAssignedIncidents, submitRootCause } from './investigation.controller';

const router = Router();

router.get('/investigator', authenticate, authorizeRoles('INVESTIGATOR'), getAssignedIncidents);
router.patch('/:id/root-cause', authenticate, authorizeRoles('INVESTIGATOR'), submitRootCause);

export default router;
