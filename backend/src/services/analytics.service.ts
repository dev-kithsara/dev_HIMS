import prisma from '../utils/prisma';

export class AnalyticsService {
  /**
   * Fetch summary statistics for a specific department
   * @param departmentId - The ID of the department
   * @returns An object containing KPIs and Chart data
   */
  async getDepartmentStats(departmentId: number) {
    // 1. Get the total number of incidents for this department
    const totalIncidents = await prisma.incident.count({
      where: { departmentId },
    });

    // 2. Get the number of OPEN incidents
    const openIncidents = await prisma.incident.count({
      where: { departmentId, status: 'OPEN' },
    });

    // 3. Get the number of CRITICAL incidents
    const criticalIncidents = await prisma.incident.count({
      where: { departmentId, severity: 'CRITICAL' },
    });

    // 4. Get the number of CLOSED incidents
    const closedIncidents = await prisma.incident.count({
      where: { departmentId, status: 'CLOSED' },
    });

    // 5. Group incidents by status (for a Pie Chart)
    const incidentsByStatus = await prisma.incident.groupBy({
      by: ['status'],
      where: { departmentId },
      _count: { status: true },
    });

    // 6. Group incidents by severity (for a Bar Chart)
    const incidentsBySeverity = await prisma.incident.groupBy({
      by: ['severity'],
      where: { departmentId },
      _count: { severity: true },
    });

    // 7. Return all the gathered data as a single formatted object
    return {
      summary: {
        total: totalIncidents,
        open: openIncidents,
        critical: criticalIncidents,
        closed: closedIncidents,
      },
      charts: {
        byStatus: incidentsByStatus.map((item) => ({
          name: item.status,
          value: item._count.status,
        })),
        bySeverity: incidentsBySeverity.map((item) => ({
          name: item.severity,
          value: item._count.severity,
        })),
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
