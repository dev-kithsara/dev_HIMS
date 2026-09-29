import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export const getDepartmentAnalytics = catchAsync(async (req: Request, res: Response) => {
  const departmentId = parseInt(req.params.departmentId as string, 10);

  if (isNaN(departmentId)) {
    throw new AppError('Invalid department ID provided in the URL.', 400);
  }

  const stats = await analyticsService.getDepartmentStats(departmentId);

  return res.status(200).json({
    success: true,
    data: stats,
  });
});
