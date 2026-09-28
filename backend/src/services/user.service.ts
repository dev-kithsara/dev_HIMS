// backend/src/services/user.service.ts

import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';

export class UserService {
  async getUsersByDepartment(departmentId: number) {
    if (!departmentId || departmentId <= 0) {
      throw new AppError('Invalid Department ID provided', 400);
    }
    return await userRepository.findByDepartmentId(departmentId);
  }

  async getUsersByRole(role: string) {
    const validRoles = ['STAFF', 'INVESTIGATOR', 'ACTION_OWNER', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }
    return await userRepository.findByRole(role);
  }

  /**
   * Change a user's role (Promote/Demote)
   * Business Rules:
   * 1. A Manager can only change roles of users in their OWN department.
   * 2. A Manager cannot change another Manager's role (or their own).
   */
  async changeUserRole(
    managerId: number,
    managerDeptId: number,
    targetUserId: number,
    newRole: string
  ) {
    // 1. Validate the new role
    const validRoles = ['STAFF', 'INVESTIGATOR', 'ACTION_OWNER'];
    if (!validRoles.includes(newRole)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }

    // 2. Fetch the target user
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found.', 404);
    }

    // 3. Security Check: Ensure target user is in the same department as the manager
    if (targetUser.departmentId !== managerDeptId) {
      throw new AppError('You can only manage users within your own department.', 403);
    }

    // 4. Security Check: Prevent modifying Manager or Admin roles
    if (targetUser.role === 'MANAGER' || targetUser.role === 'ADMIN') {
      throw new AppError('You do not have permission to modify Manager or Admin roles.', 403);
    }

    // 5. Prevent changing own role
    if (targetUser.id === managerId) {
      throw new AppError('You cannot change your own role.', 400);
    }

    // 6. Update the role
    return await userRepository.updateRole(targetUserId, newRole);
  }
}

export const userService = new UserService();
