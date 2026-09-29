import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { correctiveActionService } from './correctiveAction.service';

export const getActionOwnerIncidents = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated.', 401);
  }

  const incidents = await correctiveActionService.getActionOwnerIncidents(req.user.id);

  return res.status(200).json({
    success: true,
    data: incidents,
  });
});

export const submitCorrectiveAction = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated.', 401);
  }

  const incidentId = Number(req.params.id);
  if (isNaN(incidentId)) {
    throw new AppError('Invalid incident ID provided.', 400);
  }

  const correctiveAction = req.body.correctiveAction;
  if (typeof correctiveAction !== 'string' || correctiveAction.trim().length < 20) {
    throw new AppError('Corrective action must be at least 20 characters long.', 400);
  }

  const updatedIncident = await correctiveActionService.submitCorrectiveAction(
    incidentId,
    req.user.id,
    correctiveAction
  );

  return res.status(200).json({
    success: true,
    message: 'Corrective action submitted successfully.',
    data: updatedIncident,
  });
});
