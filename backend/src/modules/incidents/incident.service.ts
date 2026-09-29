import { Role } from '@prisma/client';
import prisma from '../../utils/prisma';
import { incidentRepository } from './incident.repository';
import { AppError } from '../../utils/AppError';
import { auditService } from '../../shared/audit/audit.service';

export interface IncidentActor {
  id: number;
  role: Role;
  departmentId: number;
}

/**
 * Service function for creating an incident (Staff Submission + Attachments)
 */
export const createIncidentService = async (
  data: any,
  files: Express.Multer.File[],
  actor: IncidentActor
) => {
  const departmentId = Number(data.departmentId);
  const reporterId = Number(data.reporterId);

  if (!departmentId || departmentId <= 0) {
    throw new AppError('Invalid department ID provided.', 400);
  }

  if (!reporterId || reporterId <= 0) {
    throw new AppError('Invalid reporter ID provided.', 400);
  }

  const [departmentExists, reporterExists] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    prisma.user.findUnique({ where: { id: reporterId } }),
  ]);

  if (!departmentExists) {
    throw new AppError('The selected department does not exist.', 404);
  }

  if (!reporterExists) {
    throw new AppError('The reporter user does not exist.', 404);
  }

  const incident = await prisma.incident.create({
    data: {
      title: data.title,
      description: data.description,
      severity: data.severity,
      category: data.category,
      location: data.location,
      status: 'OPEN',
      departmentId,
      reporterId,
    },
  });

  if (files && files.length > 0) {
    await prisma.incidentAttachment.createMany({
      data: files.map((file) => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        incidentId: incident.id,
      })),
    });
  }

  await auditService.record({
    actorId: actor.id,
    actorRole: actor.role,
    eventType: 'INCIDENT',
    action: 'CREATE',
    entityType: 'INCIDENT',
    entityId: incident.id,
    departmentId: incident.departmentId,
    after: incident,
  });

  return incident;
};

export class IncidentService {
  private assertCanViewIncident(
    incident: {
      departmentId: number;
      reporterId: number;
      investigatorId: number | null;
      actionOwnerId: number | null;
    },
    actor: IncidentActor
  ) {
    if (actor.role === 'ADMIN') return;

    const allowed =
      (actor.role === 'MANAGER' && incident.departmentId === actor.departmentId) ||
      (actor.role === 'STAFF' && incident.reporterId === actor.id) ||
      (actor.role === 'INVESTIGATOR' && incident.investigatorId === actor.id) ||
      (actor.role === 'ACTION_OWNER' && incident.actionOwnerId === actor.id);

    if (!allowed) throw new AppError('You are not authorized to access this incident.', 403);
  }

  private assertCanManageIncident(incident: { departmentId: number }, actor: IncidentActor) {
    if (actor.role === 'ADMIN') return;
    if (actor.role !== 'MANAGER' || incident.departmentId !== actor.departmentId) {
      throw new AppError('You can only manage incidents within your own department.', 403);
    }
  }

  private async auditWorkflow(
    actor: IncidentActor,
    action: string,
    incidentId: number,
    departmentId: number,
    before: unknown,
    after: unknown
  ) {
    await auditService.record({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'WORKFLOW',
      action,
      entityType: 'INCIDENT',
      entityId: incidentId,
      departmentId,
      before,
      after,
    });
  }
  /**
   * Create a new incident (Staff Incident Submission)
   */
  async createIncident(data: any, files: Express.Multer.File[], actor: IncidentActor) {
    return createIncidentService(data, files, actor);
  }

  /**
   * Get a single incident by its ID with related data
   * @param id - The ID of the incident
   * @returns The incident with relations, or 404 if not found
   */
  async getIncidentById(id: number, actor: IncidentActor) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('Invalid incident ID provided.', 400);
    }

    const incident = await incidentRepository.findByIdWithRelations(id);

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    this.assertCanViewIncident(incident, actor);

    return incident;
  }

  /**
   * Get all incidents for a specific department
   * @param departmentId - The ID of the manager's department
   * @returns Array of incidents
   */
  async getIncidentsByDepartment(departmentId: number, actor: IncidentActor) {
    if (!departmentId || departmentId <= 0) {
      throw new AppError('Invalid Department ID provided', 400); // Bad Request
    }

    // FIX FOR BUG-02: Check if the department actually exists first
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      throw new AppError('Department not found.', 404); // Not Found
    }

    if (actor.role !== 'ADMIN' && actor.departmentId !== departmentId) {
      throw new AppError('You can only access incidents within your own department.', 403);
    }

    return await incidentRepository.findByDepartmentId(departmentId);
  }

  /**
   * Accept an OPEN incident
   * @param incidentId - The ID of the incident to accept
   * @returns The updated incident
   */
  async acceptIncident(incidentId: number, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new AppError('Incident not found.', 404); // Not Found
    }

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'OPEN') {
      throw new AppError(
        `Cannot accept incident. Current status is ${incident.status}, but expected OPEN.`,
        409
      );
    }

    const updated = await incidentRepository.updateStatus(incidentId, 'ACCEPTED');
    await this.auditWorkflow(actor, 'ACCEPT', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  /**
   * Reject an OPEN incident with a reason
   * @param incidentId - The ID of the incident to reject
   * @param reason - The mandatory reason for rejection
   * @returns The updated incident
   */
  async rejectIncident(incidentId: number, reason: string, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'OPEN') {
      throw new AppError(
        `Cannot reject incident. Current status is ${incident.status}, but expected OPEN.`,
        409
      );
    }

    const updated = await incidentRepository.rejectIncident(incidentId, reason);
    await this.auditWorkflow(actor, 'REJECT', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  /**
   * Assign an investigator to an ACCEPTED incident
   * @param incidentId - The ID of the incident
   * @param investigatorId - The ID of the user to be assigned
   * @returns The updated incident
   */
  async assignInvestigator(incidentId: number, investigatorId: number, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'ACCEPTED') {
      throw new AppError(
        `Cannot assign investigator. Current status is ${incident.status}, but expected ACCEPTED.`,
        409
      );
    }

    const investigator = await prisma.user.findUnique({
      where: { id: investigatorId },
    });

    if (!investigator) {
      throw new AppError('The specified investigator does not exist.', 404);
    }

    if (investigator.role !== 'INVESTIGATOR' && investigator.role !== 'MANAGER') {
      throw new AppError(
        'The specified user does not have the required role to be an investigator.',
        403
      );
    }

    const updated = await incidentRepository.assignInvestigator(incidentId, investigatorId);
    await this.auditWorkflow(actor, 'ASSIGN_INVESTIGATOR', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  /**
   * Assign Action Owner to an INVESTIGATING incident
   * @param incidentId - The ID of the incident
   * @param actionOwnerId - The ID of the user assigned to own the action
   * @returns The updated incident
   */
  async assignActionOwner(incidentId: number, actionOwnerId: number, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'INVESTIGATING') {
      throw new AppError(
        `Cannot assign action owner. Current status is ${incident.status}, but expected INVESTIGATING.`,
        409
      );
    }

    const actionOwner = await prisma.user.findUnique({
      where: { id: actionOwnerId },
    });

    if (!actionOwner) {
      throw new AppError('The specified action owner does not exist.', 404);
    }

    if (actionOwner.role !== 'ACTION_OWNER' && actionOwner.role !== 'MANAGER') {
      throw new AppError(
        'The specified user does not have the required role to be an action owner.',
        403
      );
    }

    const updated = await incidentRepository.assignActionOwner(incidentId, actionOwnerId);
    await this.auditWorkflow(actor, 'ASSIGN_ACTION_OWNER', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  /**
   * Mark an incident as UNDER_REVIEW
   * @param incidentId - The ID of the incident
   * @returns The updated incident
   */
  async reviewIncident(incidentId: number, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 404);

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'PENDING_ACTION') {
      throw new AppError(
        `Cannot review incident. Current status is ${incident.status}, but expected PENDING_ACTION.`,
        409
      );
    }

    const updated = await incidentRepository.reviewIncident(incidentId);
    await this.auditWorkflow(actor, 'REVIEW', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  /**
   * Close the incident
   * @param incidentId - The ID of the incident
   * @returns The updated incident
   */
  async closeIncident(incidentId: number, actor: IncidentActor) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 404);

    this.assertCanManageIncident(incident, actor);

    if (incident.status !== 'UNDER_REVIEW') {
      throw new AppError(
        `Cannot close incident. Current status is ${incident.status}, but expected UNDER_REVIEW.`,
        409
      );
    }

    const updated = await incidentRepository.closeIncident(incidentId);
    await this.auditWorkflow(actor, 'CLOSE', incidentId, incident.departmentId, incident, updated);
    return updated;
  }

  async getAuthorizedAttachment(
    incidentId: number,
    attachmentId: number,
    actor: IncidentActor
  ) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 404);
    this.assertCanViewIncident(incident, actor);

    const attachment = await incidentRepository.findAttachment(incidentId, attachmentId);
    if (!attachment) throw new AppError('Evidence file not found.', 404);
    return attachment;
  }

}

// Export a single instance of the service (Singleton pattern)
export const incidentService = new IncidentService();
