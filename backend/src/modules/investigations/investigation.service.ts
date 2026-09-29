import { investigationRepository } from './investigation.repository';
import { Role } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { auditService } from '../../shared/audit/audit.service';

interface InvestigationActor {
  id: number;
  role: Role;
  departmentId: number;
}

export class InvestigationService {
  async getAssignedIncidents(investigatorId: number) {
    if (!investigatorId) {
      throw new Error('Invalid investigator ID');
    }

    return await investigationRepository.findAssignedIncidents(investigatorId);
  }

  async submitRootCause(
    incidentId: number,
    rootCause: string,
    rootCauseCategory: string,
    actor: InvestigationActor
  ) {
    const incident = await investigationRepository.findById(incidentId);

    if (!incident) {
      throw new Error('Incident not found.');
    }

    if (actor.role !== 'ADMIN' && incident.investigatorId !== actor.id) {
      throw new AppError('You are not assigned to investigate this incident.', 403);
    }

    if (incident.status !== 'INVESTIGATING') {
      throw new Error(`Cannot submit root cause. Current status is ${incident.status}.`);
    }

    const updated = await investigationRepository.updateRootCause(
      incidentId,
      rootCause,
      rootCauseCategory
    );

    await auditService.record({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'WORKFLOW',
      action: 'SUBMIT_ROOT_CAUSE',
      entityType: 'INCIDENT',
      entityId: incidentId,
      departmentId: incident.departmentId,
      before: incident,
      after: updated,
    });

    return updated;
  }
}

export const investigationService = new InvestigationService();
