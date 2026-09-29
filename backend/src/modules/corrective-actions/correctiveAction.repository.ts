import prisma from '../../utils/prisma';

export class CorrectiveActionRepository {
  async findById(id: number) {
    return await prisma.incident.findUnique({
      where: { id },
    });
  }

  async findActionOwnerIncidents(actionOwnerId: number) {
    return await prisma.incident.findMany({
      where: {
        actionOwnerId,
        status: 'PENDING_ACTION',
      },
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
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
        actionOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateCorrectiveAction(id: number, correctiveAction: string) {
    return await prisma.incident.update({
      where: { id },
      data: {
        correctiveAction,
        status: 'UNDER_REVIEW',
      },
    });
  }
}

export const correctiveActionRepository = new CorrectiveActionRepository();
