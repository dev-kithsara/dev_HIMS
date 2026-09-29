import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { catchAsync } from '../../utils/catchAsync';
import { adminService, AdminActor } from './admin.service';
import {
  configSchema,
  createDepartmentSchema,
  createModelSchema,
  createUserSchema,
  idSchema,
  incidentCorrectionSchema,
  modelTransitionSchema,
  updateDepartmentSchema,
  updateUserSchema,
} from './admin.validator';

const actorFrom = (req: Request): AdminActor => ({
  id: req.user!.id,
  role: req.user!.role as Role,
  departmentId: req.user!.departmentId,
  ipAddress: req.ip,
});

const queryFrom = (req: Request) =>
  Object.fromEntries(
    Object.entries(req.query).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value ?? '')])
  );

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const getOverview = catchAsync(async (req: Request, res: Response) => {
  const data = await adminService.getOverview(queryFrom(req));
  res.status(200).json({ success: true, data });
});

export const listIncidents = catchAsync(async (req: Request, res: Response) => {
  const data = await adminService.listIncidents(queryFrom(req));
  res.status(200).json({ success: true, data });
});

export const correctIncident = catchAsync(async (req: Request, res: Response) => {
  const incidentId = idSchema.parse(req.params.id);
  const input = incidentCorrectionSchema.parse(req.body);
  const data = await adminService.correctIncident(incidentId, input, actorFrom(req));
  res.status(200).json({ success: true, message: 'Incident corrected and audited.', data });
});

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const data = await adminService.listUsers(queryFrom(req));
  res.status(200).json({ success: true, data });
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const input = createUserSchema.parse(req.body);
  const data = await adminService.createUser(input, actorFrom(req));
  res.status(201).json({ success: true, message: 'User created.', data });
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = idSchema.parse(req.params.id);
  const input = updateUserSchema.parse(req.body);
  const data = await adminService.updateUser(userId, input, actorFrom(req));
  res.status(200).json({ success: true, message: 'User updated and audited.', data });
});

export const deactivateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = idSchema.parse(req.params.id);
  const data = await adminService.deactivateUser(userId, actorFrom(req));
  res.status(200).json({ success: true, message: 'User deactivated.', data });
});

export const listDepartments = catchAsync(async (req: Request, res: Response) => {
  const data = await adminService.listDepartments(queryFrom(req));
  res.status(200).json({ success: true, data });
});

export const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const input = createDepartmentSchema.parse(req.body);
  const data = await adminService.createDepartment(input, actorFrom(req));
  res.status(201).json({ success: true, message: 'Department created.', data });
});

export const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const departmentId = idSchema.parse(req.params.id);
  const input = updateDepartmentSchema.parse(req.body);
  const data = await adminService.updateDepartment(departmentId, input, actorFrom(req));
  res.status(200).json({ success: true, message: 'Department updated.', data });
});

export const deactivateDepartment = catchAsync(async (req: Request, res: Response) => {
  const departmentId = idSchema.parse(req.params.id);
  const data = await adminService.deactivateDepartment(departmentId, actorFrom(req));
  res.status(200).json({ success: true, message: 'Department deactivated without deleting history.', data });
});

export const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const data = await adminService.listAuditLogs(queryFrom(req));
  res.status(200).json({ success: true, data });
});

export const exportAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await adminService.listAuditLogs(queryFrom(req));
  const header = ['Time', 'Actor', 'Role', 'Event Type', 'Action', 'Entity', 'Entity ID', 'Department'];
  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.actor?.email ?? log.actorEmail ?? '',
    log.actorRole ?? '',
    log.eventType,
    log.action,
    log.entityType,
    log.entityId ?? '',
    log.departmentId ?? '',
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="admin-audit-log.csv"');
  res.status(200).send(csv);
});

export const getDataQuality = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.getDataQuality();
  res.status(200).json({ success: true, data });
});

export const getTrainingPreview = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.getTrainingPreview();
  res.status(200).json({ success: true, data });
});

export const listConfigs = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.listConfigs();
  res.status(200).json({ success: true, data });
});

export const upsertConfig = catchAsync(async (req: Request, res: Response) => {
  const input = configSchema.parse({ ...req.body, key: req.params.key });
  const data = await adminService.upsertConfig(input, actorFrom(req));
  res.status(200).json({ success: true, message: 'Configuration saved and audited.', data });
});

export const listModels = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.listModels();
  res.status(200).json({ success: true, data });
});

export const getModelHealth = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminService.getModelHealth();
  res.status(200).json({ success: true, data });
});

export const createModel = catchAsync(async (req: Request, res: Response) => {
  const input = createModelSchema.parse(req.body);
  const data = await adminService.createModel(input, actorFrom(req));
  res.status(201).json({ success: true, message: 'AI model version registered.', data });
});

export const transitionModel = catchAsync(async (req: Request, res: Response) => {
  const modelId = idSchema.parse(req.params.id);
  const input = modelTransitionSchema.parse(req.body);
  const data = await adminService.transitionModel(modelId, input, actorFrom(req));
  res.status(200).json({ success: true, message: `Model ${input.action.toLowerCase()} completed and audited.`, data });
});
