import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import {
  addControl, addLesson, addReview, assignInvestigator, closeIncident, createAction, decideIncident,
  editIncident, exportIncidents, getCandidates, getDashboard, getIncident, getRecommendations,
  listIncidents, overrideRisk, reopenIncident, reviewInvestigation, updateAction,
} from './manager.controller';

const router = Router();
router.use(authenticate, authorizeRoles('MANAGER'));

router.get('/dashboard', getDashboard);
router.get('/incidents/export', exportIncidents);
router.get('/incidents', listIncidents);
router.get('/incidents/:id', getIncident);
router.get('/incidents/:id/recommendations', getRecommendations);
router.get('/candidates/:role', getCandidates);
router.patch('/incidents/:id/decision', decideIncident);
router.patch('/incidents/:id', editIncident);
router.post('/incidents/:id/assign-investigator', assignInvestigator);
router.post('/incidents/:id/investigation-review', reviewInvestigation);
router.post('/incidents/:id/actions', createAction);
router.patch('/incidents/:id/actions/:actionId', updateAction);
router.post('/incidents/:id/controls', addControl);
router.post('/incidents/:id/reviews', addReview);
router.post('/incidents/:id/lessons', addLesson);
router.post('/incidents/:id/close', closeIncident);
router.post('/incidents/:id/reopen', reopenIncident);
router.post('/incidents/:id/risk-override', overrideRisk);

export default router;
