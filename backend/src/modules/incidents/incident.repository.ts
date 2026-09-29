import prisma from '../../utils/prisma';

export class IncidentRepository {
  
  /**
   * Fetch all incidents belonging to a specific department
   * @param departmentId - The ID of the department
   * @returns Array of incidents with reporter details
   */
  async findByDepartmentId(departmentId: number) {
    return await prisma.incident.findMany({
      where: {
        departmentId: departmentId,
      },
      // We use 'include' to perform a SQL JOIN and get related data
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        investigator: {
          select: {
            id: true,
            name: true,
          },
        },
        actionOwner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      // Sort by newest first
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find a single incident by its ID
   * @param id - The ID of the incident
   * @returns The incident object or null if not found
   */
  async findById(id: number) {
    return await prisma.incident.findUnique({
      where: { id: id },
    });
  }

  /**
   * Find a single incident by its ID with related data
   * (reporter, department, investigator, action owner, attachments)
   * @param id - The ID of the incident
   * @returns The incident with relations, or null if not found
   */
  async findByIdWithRelations(id: number) {
    return await prisma.incident.findUnique({
      where: { id: id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        investigator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actionOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });
  }

  async findAttachment(incidentId: number, attachmentId: number) {
    return prisma.incidentAttachment.findFirst({
      where: {
        id: attachmentId,
        incidentId,
      },
    });
  }

  /**
   * Update the status of an incident
   * @param id - The ID of the incident
   * @param status - The new status (e.g., ACCEPTED)
   * @returns The updated incident
   */
  async updateStatus(id: number, status: any) {
    // Note: 'any' is used temporarily for status. We will use the proper Prisma Enum type later.
    return await prisma.incident.update({
      where: { id: id },
      data: { status: status },
    });
  }

  /**
   * Reject an incident and save the reason
   * @param id - The ID of the incident
   * @param reason - The reason for rejection
   * @returns The updated incident
   */
  async rejectIncident(id: number, reason: string) {
    return await prisma.incident.update({
      where: { id: id },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason 
      },
    });
  }

  /**
   * Assign an investigator to an incident and update status to INVESTIGATING
   * @param id - The ID of the incident
   * @param investigatorId - The ID of the user assigned to investigate
   * @returns The updated incident
   */
  async assignInvestigator(id: number, investigatorId: number) {
    return await prisma.incident.update({
      where: { id: id },
      data: { 
        status: 'INVESTIGATING',
        investigatorId: investigatorId 
      },
    });
  }

  /**
   * Assign Action Owner
   * @param id - The ID of the incident
   * @param actionOwnerId - The ID of the user assigned to own the action
   * @returns The updated incident
   */
  async assignActionOwner(id: number, actionOwnerId: number) {
    return await prisma.incident.update({
      where: { id: id },
      data: {
        status: 'PENDING_ACTION',
        actionOwnerId: actionOwnerId
      }
    });
  }

  /**
   * Mark an incident as UNDER_REVIEW
   * @param id - The ID of the incident
   * @returns The updated incident
   */
  async reviewIncident(id: number) {
    return await prisma.incident.update({
      where: { id: id },
      data: {
        status: 'UNDER_REVIEW',
      },
    });
  }

  /**
   * Close the incident
   * @param id - The ID of the incident
   * @returns The updated incident
   */
  async closeIncident(id: number) {
    return await prisma.incident.update({
      where: { id: id },
      data: {
        status: 'CLOSED',
      },
    });
  }

}

export const incidentRepository = new IncidentRepository();
