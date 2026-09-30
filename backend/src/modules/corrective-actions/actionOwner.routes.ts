import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import upload from '../../middlewares/upload.middleware';
import { getActionDashboard, getActionDetail, getActionInsights, getActionNotifications, readActionNotification, resubmitAction, saveActionFeedback, updateActionProgress, uploadActionEvidence, viewActionEvidence } from './actionOwner.controller';

const router = Router();
router.use(authenticate, authorizeRoles('ACTION_OWNER'));
router.get('/dashboard', getActionDashboard);
router.get('/notifications', getActionNotifications);
router.patch('/notifications/:id/read', readActionNotification);
router.get('/actions/:id', getActionDetail);
router.patch('/actions/:id/progress', updateActionProgress);
router.post('/actions/:id/resubmit', resubmitAction);
router.post('/actions/:id/evidence', upload.single('evidence'), uploadActionEvidence);
router.get('/actions/:id/evidence/:evidenceId', viewActionEvidence);
router.get('/actions/:id/ai-insights', getActionInsights);
router.post('/actions/:id/ai-feedback', saveActionFeedback);

export default router;
