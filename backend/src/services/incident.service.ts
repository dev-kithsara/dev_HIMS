import prisma from '../utils/prisma';
import { incidentRepository } from '../repositories/incident.repository';
import { AppError } from '../utils/AppError';

/**
 * Service function for creating an incident (Staff Submission + Attachments)
 */
export const createIncidentService = async (data: any, files: Express.Multer.File[]) => {
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

  return incident;
};

export class IncidentService {
  /**
   * Create a new incident (Staff Incident Submission)
   */
  async createIncident(data: any, files: Express.Multer.File[]) {
    return createIncidentService(data, files);
  }

  /**
   * Get a single incident by its ID with related data
   * @param id - The ID of the incident
   * @returns The incident with relations, or 404 if not found
   */
  async getIncidentById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('Invalid incident ID provided.', 400);
    }

    const incident = await incidentRepository.findByIdWithRelations(id);

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    return incident;
  }

  /**
   * Get all incidents for a specific department
   * @param departmentId - The ID of the manager's department
   * @returns Array of incidents
   */
  async getIncidentsByDepartment(departmentId: number) {
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

    return await incidentRepository.findByDepartmentId(departmentId);
  }

  /**
   * Accept an OPEN incident
   * @param incidentId - The ID of the incident to accept
   * @returns The updated incident
   */
  async acceptIncident(incidentId: number) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new AppError('Incident not found.', 404); // Not Found
    }

    if (incident.status !== 'OPEN') {
      throw new AppError(
        `Cannot accept incident. Current status is ${incident.status}, but expected OPEN.`,
        409
      );
    }

    return await incidentRepository.updateStatus(incidentId, 'ACCEPTED');
  }

  /**
   * Reject an OPEN incident with a reason
   * @param incidentId - The ID of the incident to reject
   * @param reason - The mandatory reason for rejection
   * @returns The updated incident
   */
  async rejectIncident(incidentId: number, reason: string) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    if (incident.status !== 'OPEN') {
      throw new AppError(
        `Cannot reject incident. Current status is ${incident.status}, but expected OPEN.`,
        409
      );
    }

    return await incidentRepository.rejectIncident(incidentId, reason);
  }

  /**
   * Assign an investigator to an ACCEPTED incident
   * @param incidentId - The ID of the incident
   * @param investigatorId - The ID of the user to be assigned
   * @returns The updated incident
   */
  async assignInvestigator(incidentId: number, investigatorId: number) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

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

    return await incidentRepository.assignInvestigator(incidentId, investigatorId);
  }

  /**
   * Assign Action Owner to an INVESTIGATING incident
   * @param incidentId - The ID of the incident
   * @param actionOwnerId - The ID of the user assigned to own the action
   * @returns The updated incident
   */
  async assignActionOwner(incidentId: number, actionOwnerId: number) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

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

    return await incidentRepository.assignActionOwner(incidentId, actionOwnerId);
  }

  /**
   * Mark an incident as UNDER_REVIEW
   * @param incidentId - The ID of the incident
   * @returns The updated incident
   */
  async reviewIncident(incidentId: number) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 404);

    if (incident.status !== 'PENDING_ACTION') {
      throw new AppError(
        `Cannot review incident. Current status is ${incident.status}, but expected PENDING_ACTION.`,
        409
      );
    }

    return await incidentRepository.reviewIncident(incidentId);
  }

  /**
   * Close the incident
   * @param incidentId - The ID of the incident
   * @returns The updated incident
   */
  async closeIncident(incidentId: number) {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 404);

    if (incident.status !== 'UNDER_REVIEW') {
      throw new AppError(
        `Cannot close incident. Current status is ${incident.status}, but expected UNDER_REVIEW.`,
        409
      );
    }

    return await incidentRepository.closeIncident(incidentId);
  }

  /**
   * Get incidents assigned to investigator
   */
  async getAssignedIncidents(investigatorId: number) {
    if (!investigatorId) {
      throw new Error('Invalid investigator ID');
    }

    return await incidentRepository.findAssignedIncidents(investigatorId);
  }

    /**
   * Get incidents assigned to the logged-in Action Owner
   * Only returns incidents with PENDING_ACTION status
   */
  async getActionOwnerIncidents(actionOwnerId: number) {
    if (!actionOwnerId || actionOwnerId <= 0) {
      throw new AppError('Invalid Action Owner ID.', 400);
    }

    return await incidentRepository.findActionOwnerIncidents(actionOwnerId);
  }

    /**
   * Submit corrective action for an incident
   * Changes status from PENDING_ACTION to UNDER_REVIEW
   */
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

    // Validate corrective action
    if (!correctiveAction || correctiveAction.trim().length < 20) {
      throw new AppError(
        'Corrective action must be at least 20 characters long.',
        400
      );
    }

    // Find the incident
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    // Make sure this incident belongs to the logged-in Action Owner
    if (incident.actionOwnerId !== actionOwnerId) {
      throw new AppError(
        'You are not authorized to submit a corrective action for this incident.',
        403
      );
    }

    // Business rule: incident must be PENDING_ACTION
    if (incident.status !== 'PENDING_ACTION') {
      throw new AppError(
        `Cannot submit corrective action. Current status is ${incident.status}, but expected PENDING_ACTION.`,
        409
      );
    }

    // Save corrective action and change status to UNDER_REVIEW
    return await incidentRepository.updateCorrectiveAction(
      incidentId,
      correctiveAction.trim()
    );
  }

  /**
   * Submit Root Cause Analysis findings
   * @param incidentId - Incident ID
   * @param rootCause - RCA explanation
   * @param rootCauseCategory - RCA category
   */
  async submitRootCause(incidentId: number, rootCause: string, rootCauseCategory: string) {
    const incident = await incidentRepository.findById(incidentId);

    if (!incident) {
      throw new Error('Incident not found.');
    }

    if (incident.status !== 'INVESTIGATING') {
      throw new Error(`Cannot submit root cause. Current status is ${incident.status}.`);
    }

    const updatedIncident = await incidentRepository.updateRootCause(
      incidentId,
      rootCause,
      rootCauseCategory
    );

    return updatedIncident;
  }
}

// Export a single instance of the service (Singleton pattern)
export const incidentService = new IncidentService();
