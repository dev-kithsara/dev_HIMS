// frontend/src/api/user.api.ts

import { apiClient } from './axios';
import type { User, ApiResponse } from '../types/incident';

const API_URL = '/users';

/**
 * Fetch all users in the manager's department
 */
export const getDepartmentUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>(`${API_URL}/department`);
  return response.data.data;
};

/**
 * Change a user's role
 */
export const changeUserRole = async (userId: number, newRole: string): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>(`${API_URL}/${userId}/role`, {
    newRole,
  });
  return response.data.data;
};
