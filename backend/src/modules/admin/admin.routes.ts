import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import {
  correctIncident,
  createDepartment,
  createModel,
  createUser,
  deactivateDepartment,
  deactivateUser,
  exportAuditLogs,
  getDataQuality,
  getTrainingPreview,
  getModelHealth,
  getOverview,
  listAuditLogs,
  listConfigs,
  listDepartments,
  listIncidents,
  listModels,
  listUsers,
  transitionModel,
  updateDepartment,
  updateUser,
  upsertConfig,
} from './admin.controller';

const router = Router();

router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/overview', getOverview);
router.get('/incidents', listIncidents);
router.patch('/incidents/:id/correct', correctIncident);

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/deactivate', deactivateUser);

router.get('/departments', listDepartments);
router.post('/departments', createDepartment);
router.patch('/departments/:id', updateDepartment);
router.patch('/departments/:id/deactivate', deactivateDepartment);

router.get('/audit-logs', listAuditLogs);
router.get('/audit-logs/export', exportAuditLogs);

router.get('/data-quality', getDataQuality);
router.get('/data-quality/training-preview', getTrainingPreview);
router.get('/config', listConfigs);
router.put('/config/:key', upsertConfig);

router.get('/models/health', getModelHealth);
router.get('/models', listModels);
router.post('/models', createModel);
router.post('/models/:id/transition', transitionModel);

export default router;
