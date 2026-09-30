import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { catchAsync } from '../../utils/catchAsync';
import { actionOwnerService, ActionOwnerActor } from './actionOwner.service';
import { actionIdSchema, actionListSchema, feedbackSchema, progressSchema, resubmitSchema } from './actionOwner.validator';

const actorFrom = (req: Request): ActionOwnerActor => ({ id: req.user!.id, role: req.user!.role as Role, departmentId: req.user!.departmentId, ipAddress: req.ip });
const queryFrom = (req: Request) => Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, String(value ?? '')]));

export const getActionDashboard = catchAsync(async (req: Request, res: Response) => res.json({ success: true, data: await actionOwnerService.dashboard(actorFrom(req), actionListSchema.parse(queryFrom(req))) }));
export const getActionDetail = catchAsync(async (req: Request, res: Response) => res.json({ success: true, data: await actionOwnerService.detail(actionIdSchema.parse(req.params.id), actorFrom(req)) }));
export const updateActionProgress = catchAsync(async (req: Request, res: Response) => res.json({ success: true, message: 'Action progress saved and audited.', data: await actionOwnerService.progress(actionIdSchema.parse(req.params.id), progressSchema.parse(req.body), actorFrom(req)) }));
export const resubmitAction = catchAsync(async (req: Request, res: Response) => res.json({ success: true, message: 'Action resubmitted for Manager verification.', data: await actionOwnerService.resubmit(actionIdSchema.parse(req.params.id), resubmitSchema.parse(req.body), actorFrom(req)) }));
export const uploadActionEvidence = catchAsync(async (req: Request, res: Response) => res.status(201).json({ success: true, message: 'Evidence uploaded securely.', data: await actionOwnerService.addEvidence(actionIdSchema.parse(req.params.id), req.file, actorFrom(req)) }));
export const viewActionEvidence = catchAsync(async (req: Request, res: Response) => { const file = await actionOwnerService.evidencePath(actionIdSchema.parse(req.params.id), actionIdSchema.parse(req.params.evidenceId), actorFrom(req)); res.type(file.fileType).sendFile(file.absolutePath); });
export const getActionNotifications = catchAsync(async (req: Request, res: Response) => res.json({ success: true, data: await actionOwnerService.notifications(actorFrom(req)) }));
export const readActionNotification = catchAsync(async (req: Request, res: Response) => res.json({ success: true, data: await actionOwnerService.readNotification(actionIdSchema.parse(req.params.id), actorFrom(req)) }));
export const getActionInsights = catchAsync(async (req: Request, res: Response) => res.json({ success: true, data: await actionOwnerService.insights(actionIdSchema.parse(req.params.id), actorFrom(req)) }));
export const saveActionFeedback = catchAsync(async (req: Request, res: Response) => res.status(201).json({ success: true, message: 'AI feedback recorded.', data: await actionOwnerService.feedback(actionIdSchema.parse(req.params.id), feedbackSchema.parse(req.body), actorFrom(req)) }));
