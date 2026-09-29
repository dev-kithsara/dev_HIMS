import prisma from '../../utils/prisma';

export class InvestigationRepository {
  async findById(id: number) {
    return await prisma.incident.findUnique({
      where: { id },
    });
  }

  async findAssignedIncidents(investigatorId: number) {
    return await prisma.incident.findMany({
      where: {
        investigatorId,
        status: 'INVESTIGATING',
      },
      include: {
        reporter: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateRootCause(id: number, rootCause: string, rootCauseCategory: string) {
    return await prisma.incident.update({
      where: { id },
      data: {
        rootCause,
        rootCauseCategory,
        investigationReviewStatus: 'SUBMITTED',
      },
    });
  }
}

export const investigationRepository = new InvestigationRepository();
