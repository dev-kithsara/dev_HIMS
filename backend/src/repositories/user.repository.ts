// backend/src/repositories/user.repository.ts

import prisma from '../utils/prisma';

export class UserRepository {
  /**
   * Find all users belonging to a specific department
   * Excludes passwords from the result for security
   */
  async findByDepartmentId(departmentId: number) {
    return await prisma.user.findMany({
      where: { departmentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find all users by role
   * Excludes passwords from the result for security
   */
  async findByRole(role: string) {
    return await prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a user's role
   */
  async updateRole(userId: number, newRole: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  /**
   * Find a single user by ID
   */
  async findById(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}

export const userRepository = new UserRepository();
