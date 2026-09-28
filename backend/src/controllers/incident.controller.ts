// backend/src/controllers/incident.controller.ts

import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import {
  incidentSchema,
  rejectIncidentSchema,
  assignInvestigatorSchema,
  assignActionOwnerSchema,
  departmentParamsSchema,
} from '../validators/incident.validator';
import { rootCauseSchema } from '../validators/rootCause.validator';
import { incidentService, createIncidentService } from '../services/incident.service';
import { catchAsync } from '../utils/catchAsync'; // Import our magic wrapper
import { AppError } from '../utils/AppError';

/**
 * Controller for creating a new incident report
 * Wrapped in catchAsync to automatically handle errors
 */
export const createIncident = catchAsync(async (req: Request, res: Response) => {
  // 1. Validate input using Zod
  const validatedData = incidentSchema.parse(req.body);

  // 2. Security Check (FIX FOR BUG-01)
  // Ensure the user is authenticated before creating an incident.
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }
// 3. Override the reporterId with the securely verified ID from the JWT token.
  // This prevents malicious users from submitting incidents on behalf of others.
  // departmentId comes from the form: the reporter selects the department
  // the incident belongs to.
 const incidentData = {
  ...validatedData,
  reporterId: req.user.id,
};

  // 4. Call service with the securely validated data
  const incident = await createIncidentService(
    incidentData,
    req.files as Express.Multer.File[]
  );

  // 5. Send response
  return res.status(201).json({
    success: true,
    message: 'Incident created successfully',
    incident,
  });
});

export const getDepartmentIncidents = catchAsync(async (req: Request, res: Response) => {
  const params = departmentParamsSchema.parse(req.params);
  const departmentId = params.departmentId;

  const incidents = await incidentService.getIncidentsByDepartment(departmentId);
  return res.status(200).json({ success: true, data: incidents });
});

export const getIncidentById = catchAsync(async (req: Request, res: Response) => {
  const incidentId = Number(req.params.id);

  const incident = await incidentService.getIncidentById(incidentId);
  return res.status(200).json({ success: true, data: incident });
});

export const acceptIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.acceptIncident(incidentId);
  return res
    .status(200)
    .json({ success: true, message: 'Incident accepted.', data: updatedIncident });
});

export const rejectIncident = catchAsync(async (req: Request, res: Response) => {
  const validatedData = rejectIncidentSchema.parse({ body: req.body });
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.rejectIncident(
    incidentId,
    validatedData.body.reason
  );
  return res
    .status(200)
    .json({ success: true, message: 'Incident rejected.', data: updatedIncident });
});

export const assignInvestigator = catchAsync(async (req: Request, res: Response) => {
  const validatedData = assignInvestigatorSchema.parse({ body: req.body });
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.assignInvestigator(
    incidentId,
    validatedData.body.investigatorId
  );
  return res
    .status(200)
    .json({ success: true, message: 'Investigator assigned successfully.', data: updatedIncident });
});

export const assignActionOwner = catchAsync(async (req: Request, res: Response) => {
  const validatedData = assignActionOwnerSchema.parse({ body: req.body });
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.assignActionOwner(
    incidentId,
    validatedData.body.actionOwnerId
  );
  return res
    .status(200)
    .json({ success: true, message: 'Action owner assigned successfully.', data: updatedIncident });
});

export const reviewIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.reviewIncident(incidentId);
  return res
    .status(200)
    .json({ success: true, message: 'Incident marked as UNDER_REVIEW.', data: updatedIncident });
});

export const closeIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.closeIncident(incidentId);
  return res
    .status(200)
    .json({ success: true, message: 'Incident closed.', data: updatedIncident });
});

/**
 * Get incidents assigned to investigator
 * Feature 4 - Investigator Workspace
 */
export const getAssignedIncidents = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated.', 401);
  }

  const investigatorId = req.user.id;
  const incidents = await incidentService.getAssignedIncidents(investigatorId);

  return res.status(200).json({
    success: true,
    data: incidents,
  });
});

/**
 * Get incidents assigned to the logged-in Action Owner
 * Feature 5 - Action Owner Workspace
 */
export const getActionOwnerIncidents = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated.', 401);
    }

    const actionOwnerId = req.user.id;

    const incidents = await incidentService.getActionOwnerIncidents(actionOwnerId);

    return res.status(200).json({
      success: true,
      data: incidents,
    });
  }
);

/**
 * Submit corrective action
 * Feature 5 - Action Owner Workspace
 */
export const submitCorrectiveAction = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated.', 401);
    }
    const incidentId = Number(req.params.id);

    if (isNaN(incidentId)) {
      throw new AppError('Invalid incident ID provided.', 400);
    }

    const correctiveAction = req.body.correctiveAction;

    if (
      typeof correctiveAction !== 'string' ||
      correctiveAction.trim().length < 20
    ) {
      throw new AppError(
        'Corrective action must be at least 20 characters long.',
        400
      );
    }

    const updatedIncident =
      await incidentService.submitCorrectiveAction(
        incidentId,
        req.user.id,
        correctiveAction
      );

    return res.status(200).json({
      success: true,
      message: 'Corrective action submitted successfully.',
      data: updatedIncident,
    });
  }
);


/**
 * Submit Root Cause Analysis findings
 * Investigator submits RCA details
 */
export const submitRootCause = catchAsync(async (req: Request, res: Response) => {
  const validatedData = rootCauseSchema.parse(req.body);
  const incidentId = Number(req.params.id);

  if (isNaN(incidentId)) {
    throw new AppError('Invalid incident ID provided.', 400);
  }

  const updatedIncident = await incidentService.submitRootCause(
    incidentId,
    validatedData.rootCause,
    validatedData.rootCauseCategory
  );

  return res.status(200).json({
    success: true,
    message: 'Root cause submitted successfully',
    data: updatedIncident,
  });
});
