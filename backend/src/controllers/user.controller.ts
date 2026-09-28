// backend/src/controllers/user.controller.ts

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

// 1. Zod Schemas for robust validation
const changeRoleSchema = z.object({
  body: z.object({
    newRole: z.enum(['STAFF', 'INVESTIGATOR', 'ACTION_OWNER'], {
      errorMap: () => ({ message: 'Role must be STAFF, INVESTIGATOR, or ACTION_OWNER' }),
    }),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a positive integer'),
  }),
});

const getRoleSchema = z.object({
  params: z.object({
    role: z.enum(['STAFF', 'INVESTIGATOR', 'ACTION_OWNER', 'MANAGER', 'ADMIN'], {
      errorMap: () => ({ message: 'Invalid role parameter' }),
    }),
  }),
});

/**
 * Get all users in the manager's department
 */
export const getDepartmentUsers = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated.', 401);

  const departmentId = req.user.departmentId;
  const users = await userService.getUsersByDepartment(departmentId);

  return res.status(200).json({
    success: true,
    data: users,
  });
});

/**
 * Get all users with a specific role
 */
export const getUsersByRole = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated.', 401);

  const rawRole = (req.params.role as string)?.toUpperCase();
  const parsed = getRoleSchema.safeParse({ params: { role: rawRole } });
  if (!parsed.success) {
    throw new AppError('Invalid role specified.', 400);
  }

  const users = await userService.getUsersByRole(parsed.data.params.role);

  return res.status(200).json({
    success: true,
    data: users,
  });
});

/**
 * Change a user's role (Promote/Demote)
 */
export const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated.', 401);

  // 1. Validate both params and body with Zod
  const validated = changeRoleSchema.parse({
    body: req.body,
    params: req.params,
  });

  const { newRole } = validated.body;
  const targetUserId = Number.parseInt(validated.params.id, 10);

  // 2. Call the service layer with the Manager's details and the Target User's details
  const updatedUser = await userService.changeUserRole(
    req.user.id,
    req.user.departmentId,
    targetUserId,
    newRole
  );

  return res.status(200).json({
    success: true,
    message: `User role successfully updated to ${newRole}.`,
    data: updatedUser,
  });
});
