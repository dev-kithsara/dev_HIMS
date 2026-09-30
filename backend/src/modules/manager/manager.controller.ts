import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { catchAsync } from '../../utils/catchAsync';
import { managerService, ManagerActor } from './manager.service';
import {
  actionItemSchema,
  actionReviewSchema,
  assignInvestigatorSchema,
  closeIncidentSchema,
  controlAssessmentSchema,
  idSchema,
  incidentListQuerySchema,
  investigationReviewSchema,
  lessonSchema,
  managementReviewSchema,
  managerDecisionSchema,
  managerEditSchema,
  reopenIncidentSchema,
  riskOverrideSchema,
  updateActionItemSchema,
} from './manager.validator';

const actorFrom = (req: Request): ManagerActor => ({
  id: req.user!.id,
  role: req.user!.role as Role,
  departmentId: req.user!.departmentId,
  ipAddress: req.ip,
});

const queryFrom = (req: Request) => Object.fromEntries(
  Object.entries(req.query).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value ?? '')])
);

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  res.json({ success: true, data: await managerService.dashboard(actorFrom(req)) });
});

export const listIncidents = catchAsync(async (req: Request, res: Response) => {
  const query = incidentListQuerySchema.parse(queryFrom(req));
  res.json({ success: true, data: await managerService.listIncidents(actorFrom(req), query) });
});

export const exportIncidents = catchAsync(async (req: Request, res: Response) => {
  const query = incidentListQuerySchema.parse({ ...queryFrom(req), page: 1, pageSize: 100 });
  const incidents = await managerService.exportIncidents(actorFrom(req), query);
  const header = ['ID', 'Title', 'Severity', 'Status', 'Category', 'Location', 'Department', 'Reporter', 'Investigator', 'Action Owner', 'Reported Date'];
  const rows = incidents.map((incident) => [
    incident.id, incident.title, incident.severity, incident.status, incident.category, incident.location,
    incident.department.name, incident.reporter.name, incident.investigator?.name ?? '', incident.actionOwner?.name ?? '',
    incident.createdAt.toISOString(),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="department-incidents.csv"');
  res.send(csv);
});

export const getIncident = catchAsync(async (req: Request, res: Response) => {
  res.json({ success: true, data: await managerService.getIncident(idSchema.parse(req.params.id), actorFrom(req)) });
});

export const getCandidates = catchAsync(async (req: Request, res: Response) => {
  const role = req.params.role === 'action-owner' ? 'ACTION_OWNER' : 'INVESTIGATOR';
  res.json({ success: true, data: await managerService.getCandidates(actorFrom(req), role) });
});

export const decideIncident = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.decide(idSchema.parse(req.params.id), managerDecisionSchema.parse(req.body), actorFrom(req));
  res.json({ success: true, message: 'Manager decision saved and audited.', data });
});

export const editIncident = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.editIncident(idSchema.parse(req.params.id), managerEditSchema.parse(req.body), actorFrom(req));
  res.json({ success: true, message: 'Incident updated and audited.', data });
});

export const assignInvestigator = catchAsync(async (req: Request, res: Response) => {
  const input = assignInvestigatorSchema.parse(req.body);
  const data = await managerService.assignInvestigator(idSchema.parse(req.params.id), input.investigatorId, actorFrom(req));
  res.json({ success: true, message: 'Investigator assigned and audited.', data });
});

export const reviewInvestigation = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.reviewInvestigation(idSchema.parse(req.params.id), investigationReviewSchema.parse(req.body), actorFrom(req));
  res.json({ success: true, message: 'Investigation review saved and audited.', data });
});

export const createAction = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.createAction(idSchema.parse(req.params.id), actionItemSchema.parse(req.body), actorFrom(req));
  res.status(201).json({ success: true, message: 'Action item created.', data });
});

export const updateAction = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.updateAction(idSchema.parse(req.params.id), idSchema.parse(req.params.actionId), updateActionItemSchema.parse(req.body), actorFrom(req));
  res.json({ success: true, message: 'Action item updated and audited.', data });
});

export const reviewAction = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.reviewAction(idSchema.parse(req.params.id), idSchema.parse(req.params.actionId), actionReviewSchema.parse(req.body), actorFrom(req));
  res.json({ success: true, message: 'Action review saved and audited.', data });
});

export const addControl = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.addControl(idSchema.parse(req.params.id), controlAssessmentSchema.parse(req.body), actorFrom(req));
  res.status(201).json({ success: true, message: 'Control assessment recorded.', data });
});

export const addReview = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.addReview(idSchema.parse(req.params.id), managementReviewSchema.parse(req.body), actorFrom(req));
  res.status(201).json({ success: true, message: 'Management review recorded.', data });
});

export const addLesson = catchAsync(async (req: Request, res: Response) => {
  const data = await managerService.addLesson(idSchema.parse(req.params.id), lessonSchema.parse(req.body), actorFrom(req));
  res.status(201).json({ success: true, message: 'Lesson dissemination saved.', data });
});

export const closeIncident = catchAsync(async (req: Request, res: Response) => {
  const input = closeIncidentSchema.parse(req.body);
  const data = await managerService.close(idSchema.parse(req.params.id), input.closureSummary, actorFrom(req));
  res.json({ success: true, message: 'Incident closed with a structured closure record.', data });
});

export const reopenIncident = catchAsync(async (req: Request, res: Response) => {
  const input = reopenIncidentSchema.parse(req.body);
  const data = await managerService.reopen(idSchema.parse(req.params.id), input.reason, actorFrom(req));
  res.json({ success: true, message: 'Incident reopened and closure history preserved.', data });
});

export const overrideRisk = catchAsync(async (req: Request, res: Response) => {
  const input = riskOverrideSchema.parse(req.body);
  const data = await managerService.overrideRisk(idSchema.parse(req.params.id), input.level, input.reason, actorFrom(req));
  res.json({ success: true, message: 'Risk score overridden with an audit reason.', data });
});

export const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  res.json({ success: true, data: await managerService.recommendations(idSchema.parse(req.params.id), actorFrom(req)) });
});
