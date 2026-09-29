import { AppError } from '../../utils/AppError';
import { correctiveActionRepository } from './correctiveAction.repository';
import { auditService } from '../../shared/audit/audit.service';

export class CorrectiveActionService {
  async getActionOwnerIncidents(actionOwnerId: number) {
    if (!actionOwnerId || actionOwnerId <= 0) {
      throw new AppError('Invalid Action Owner ID.', 400);
    }

    return await correctiveActionRepository.findActionOwnerIncidents(actionOwnerId);
  }

  async submitCorrectiveAction(
    incidentId: number,
    actionOwnerId: number,
    correctiveAction: string
  ) {
    if (!incidentId || incidentId <= 0) {
      throw new AppError('Invalid incident ID.', 400);
    }

    if (!actionOwnerId || actionOwnerId <= 0) {
      throw new AppError('Invalid Action Owner ID.', 400);
    }

    if (!correctiveAction || correctiveAction.trim().length < 20) {
      throw new AppError('Corrective action must be at least 20 characters long.', 400);
    }

    const incident = await correctiveActionRepository.findById(incidentId);
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    if (incident.actionOwnerId !== actionOwnerId) {
      throw new AppError(
        'You are not authorized to submit a corrective action for this incident.',
        403
      );
    }

    if (incident.status !== 'PENDING_ACTION') {
      throw new AppError(
        `Cannot submit corrective action. Current status is ${incident.status}, but expected PENDING_ACTION.`,
        409
      );
    }

    const updated = await correctiveActionRepository.updateCorrectiveAction(
      incidentId,
      correctiveAction.trim()
    );

    await auditService.record({
      actorId: actionOwnerId,
      actorRole: 'ACTION_OWNER',
      eventType: 'WORKFLOW',
      action: 'SUBMIT_CORRECTIVE_ACTION',
      entityType: 'INCIDENT',
      entityId: incidentId,
      departmentId: incident.departmentId,
      before: incident,
      after: updated,
    });

    return updated;
  }
}

export const correctiveActionService = new CorrectiveActionService();
