import prisma from '../../utils/prisma';

export class DepartmentService {
  /**
   * Fetch the list of all departments
   * @returns Array of departments { id, name }
   */
  async getAllDepartments() {
    return await prisma.department.findMany({
      orderBy: { id: 'asc' },
    });
  }
}

export const departmentService = new DepartmentService();
