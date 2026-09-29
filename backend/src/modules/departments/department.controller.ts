import { Request, Response } from 'express';
import { departmentService } from './department.service';
import { catchAsync } from '../../utils/catchAsync';

export const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const departments = await departmentService.getAllDepartments();

  return res.status(200).json({
    success: true,
    data: departments,
  });
});
