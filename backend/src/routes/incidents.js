const router = require('express').Router();
const ctrl   = require('../controllers/incidentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Core CRUD
router.get('/',       ctrl.list);
router.post('/',      authorize('admin', 'staff'), ctrl.create);
router.get('/export', ctrl.exportCsv);
router.get('/lessons-learned', ctrl.listLessonsLearned);
router.get('/root-cause-analytics', ctrl.getRootCauseAnalytics);
router.get('/control-effectiveness', ctrl.getControlEffectiveness);
router.get('/:id',    ctrl.getById);
router.put('/:id',    authorize('admin', 'department_manager'), ctrl.update);
router.delete('/:id', authorize('admin', 'department_manager'), ctrl.softDelete);

// ── Lifecycle transitions (manager/admin only) ─────────────────────────────
router.post('/:id/accept',               authorize('admin', 'department_manager'), ctrl.acceptIncident);
router.post('/:id/reject',               authorize('admin', 'department_manager'), ctrl.rejectIncident);
router.post('/:id/assign-investigator',  authorize('admin', 'department_manager'), ctrl.assignInvestigator);
router.post('/:id/assign-action-owner',  authorize('admin', 'department_manager'), ctrl.assignActionOwner);

// ── Actions ────────────────────────────────────────────────────────────────
router.post('/:id/actions',     authorize('admin', 'department_manager'), ctrl.addAction);
router.get('/:id/actions',      ctrl.getActions);
router.put('/:id/actions/:aId', authorize('admin', 'department_manager', 'action_owner'), ctrl.updateAction);

// ── Investigation (investigator documents findings) ────────────────────────
const multer  = require('multer');
const path    = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/:id/investigation',   authorize('admin', 'investigator'), ctrl.addInvestigation);
router.get('/:id/investigation',    ctrl.getInvestigation);
router.post('/:id/upload-evidence', authorize('admin', 'investigator'), upload.array('files'), ctrl.uploadEvidence);

// ── Root Cause (investigator documents) ───────────────────────────────────
router.post('/:id/root-cause', authorize('admin', 'investigator'), ctrl.addRootCause);
router.get('/:id/root-cause',  ctrl.getRootCause);

// ── Controls ───────────────────────────────────────────────────────────────
router.post('/:id/controls', authorize('admin', 'department_manager', 'investigator'), ctrl.addControl);
router.get('/:id/controls',  ctrl.getControls);

// ── Review ─────────────────────────────────────────────────────────────────
router.post('/:id/review', authorize('admin', 'department_manager'), ctrl.addReview);
router.get('/:id/review',  ctrl.getReview);

// ── Close ──────────────────────────────────────────────────────────────────
router.post('/:id/close', authorize('admin', 'department_manager'), ctrl.closeIncident);
router.get('/:id/close',  ctrl.getClosure);

// ── Timeline ───────────────────────────────────────────────────────────────
router.get('/:id/timeline', ctrl.getTimeline);

module.exports = router;
