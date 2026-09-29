import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { investigationService } from './investigation.service';
import { rootCauseSchema } from './rootCause.validator';

export const getAssignedIncidents = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated.', 401);
  }

  const incidents = await investigationService.getAssignedIncidents(req.user.id);

  return res.status(200).json({
    success: true,
    data: incidents,
  });
});

export const submitRootCause = catchAsync(async (req: Request, res: Response) => {
  const validatedData = rootCauseSchema.parse(req.body);
  const incidentId = Number(req.params.id);

  if (isNaN(incidentId)) {
    throw new AppError('Invalid incident ID provided.', 400);
  }

  const updatedIncident = await investigationService.submitRootCause(
    incidentId,
    validatedData.rootCause,
    validatedData.rootCauseCategory,
    req.user!
  );

  return res.status(200).json({
    success: true,
    message: 'Root cause submitted successfully',
    data: updatedIncident,
  });
});
