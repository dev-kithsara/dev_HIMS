import { Router } from 'express';
import { getDepartmentAnalytics } from './analytics.controller';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get(
  '/department/:departmentId',
  authenticate,
  authorizeRoles('MANAGER', 'ADMIN'),
  getDepartmentAnalytics
);

export default router;
