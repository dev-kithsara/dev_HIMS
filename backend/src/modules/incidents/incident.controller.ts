// backend/src/controllers/incident.controller.ts

import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { z, ZodError } from 'zod';
import {
  incidentSchema,
  rejectIncidentSchema,
  assignInvestigatorSchema,
  assignActionOwnerSchema,
  departmentParamsSchema,
} from './incident.validator';
import { incidentService, createIncidentService, IncidentActor } from './incident.service';
import { catchAsync } from '../../utils/catchAsync'; // Import our magic wrapper
import { AppError } from '../../utils/AppError';

const actorFrom = (req: Request) => req.user as IncidentActor;

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
    req.files as Express.Multer.File[],
    actorFrom(req)
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

  const incidents = await incidentService.getIncidentsByDepartment(departmentId, actorFrom(req));
  return res.status(200).json({ success: true, data: incidents });
});

export const getIncidentById = catchAsync(async (req: Request, res: Response) => {
  const incidentId = Number(req.params.id);

  const incident = await incidentService.getIncidentById(incidentId, actorFrom(req));
  return res.status(200).json({ success: true, data: incident });
});

export const acceptIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.acceptIncident(incidentId, actorFrom(req));
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
    validatedData.body.reason,
    actorFrom(req)
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
    validatedData.body.investigatorId,
    actorFrom(req)
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
    validatedData.body.actionOwnerId,
    actorFrom(req)
  );
  return res
    .status(200)
    .json({ success: true, message: 'Action owner assigned successfully.', data: updatedIncident });
});

export const reviewIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.reviewIncident(incidentId, actorFrom(req));
  return res
    .status(200)
    .json({ success: true, message: 'Incident marked as UNDER_REVIEW.', data: updatedIncident });
});

export const closeIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = parseInt(req.params.id as string, 10);
  if (isNaN(incidentId)) throw new AppError('Invalid incident ID provided.', 400);

  const updatedIncident = await incidentService.closeIncident(incidentId, actorFrom(req));
  return res
    .status(200)
    .json({ success: true, message: 'Incident closed.', data: updatedIncident });
});

export const downloadEvidence = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const incidentId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    if (!Number.isInteger(incidentId) || !Number.isInteger(attachmentId)) {
      throw new AppError('Invalid incident or attachment ID.', 400);
    }

    const attachment = await incidentService.getAuthorizedAttachment(
      incidentId,
      attachmentId,
      actorFrom(req)
    );
    const evidenceRoot = path.resolve(process.cwd(), 'uploads', 'evidence');
    const absolutePath = path.resolve(process.cwd(), attachment.filePath);
    const relativePath = path.relative(evidenceRoot, absolutePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new AppError('Invalid evidence file path.', 403);
    }

    res.download(absolutePath, attachment.fileName, (error) => {
      if (error) next(new AppError('Evidence file is unavailable.', 404));
    });
  }
);

