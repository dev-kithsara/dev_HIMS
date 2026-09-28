import { Router } from "express";
import {
  createIncident,
  getDepartmentIncidents,
  getIncidentById,
  acceptIncident,
  rejectIncident,
  assignInvestigator,
  assignActionOwner,
  reviewIncident,
  closeIncident,
  getAssignedIncidents,
  submitRootCause,
  getActionOwnerIncidents,
  submitCorrectiveAction
} from "../controllers/incident.controller";

import upload from "../middlewares/upload.middleware";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware";

const router = Router();

// ==========================================
// SECURED ROUTES
// All routes below require a valid JWT token
// ==========================================

// Route: POST /api/v1/incidents or /api/incidents
// Description: Submit a new incident report with up to 5 evidence file attachments (Staff)
router.post(
  "/",
  authenticate, // 1. Check if user is logged in (has valid token)
  authorizeRoles("STAFF"), // 2. Check if user has the 'STAFF' role
  upload.array("evidence", 5), // 3. Handle file uploads (up to 5 files)
  createIncident
);


// Route: GET /api/incidents/action-owner
// Description: Get incidents assigned to the logged-in Action Owner
// Access: ACTION_OWNER only
router.get("/action-owner", authenticate, authorizeRoles("ACTION_OWNER"), getActionOwnerIncidents);

// Route: PATCH /api/incidents/:id/corrective-action
// Description: Action Owner submits corrective action
// Access: ACTION_OWNER only
router.patch("/:id/corrective-action", authenticate, authorizeRoles("ACTION_OWNER"), submitCorrectiveAction);

// Route: GET /api/incidents/department/:departmentId
// Description: Get all incidents for a specific department
// Access: MANAGER only
router.get(
  '/department/:departmentId', 
  authenticate, // 1. Check if user is logged in (has valid token)
  authorizeRoles('MANAGER', 'STAFF'), // 2. Check if user has the 'MANAGER','STAFF' role
  getDepartmentIncidents // 3. If both pass, execute the controller
);

// Route: PATCH /api/incidents/:id/accept
// Description: Accept an OPEN incident
// Access: MANAGER only
router.patch("/:id/accept", authenticate, authorizeRoles('MANAGER'), acceptIncident);

// Route: PATCH /api/incidents/:id/reject
// Description: Reject an OPEN incident with a reason
// Access: MANAGER only
router.patch("/:id/reject", authenticate, authorizeRoles('MANAGER'), rejectIncident);

// Route: PATCH /api/incidents/:id/assign-investigator
// Description: Assign an investigator to an ACCEPTED incident
// Access: MANAGER only
router.patch("/:id/assign-investigator",authenticate, authorizeRoles('MANAGER'), assignInvestigator);

// Route: PATCH /api/incidents/:id/assign-action-owner
// Description: Assign an action owner to an INVESTIGATING incident
// Access: MANAGER only
router.patch("/:id/assign-action-owner", authenticate, authorizeRoles('MANAGER'), assignActionOwner);

// Route: PATCH /api/incidents/:id/review
// Description: Mark an incident as UNDER_REVIEW
// Access: MANAGER only
router.patch("/:id/review", authenticate, authorizeRoles('MANAGER'), reviewIncident);

// Route: PATCH /api/incidents/:id/close
// Description: Close the incident
// Access: MANAGER only
router.patch("/:id/close", authenticate, authorizeRoles('MANAGER'), closeIncident);

// Route: GET /api/v1/incidents/investigator
// Description: Get incidents assigned to the logged-in investigator
router.get("/investigator", authenticate, authorizeRoles("INVESTIGATOR"), getAssignedIncidents);

// Route: PATCH /api/v1/incidents/:id/root-cause
// Description: Investigator submits Root Cause Analysis findings
router.patch("/:id/root-cause", authenticate, authorizeRoles("INVESTIGATOR"), submitRootCause);

// Route: GET /api/v1/incidents/:id
// Description: Get a single incident by ID with related data
// NOTE: Registered last so it does not shadow /action-owner or /investigator
router.get("/:id", authenticate, getIncidentById);

export default router;