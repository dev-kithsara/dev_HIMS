import { apiClient } from './axios';
import type {
  Incident,
  ApiResponse,
  DepartmentAnalytics,
  Department,
  User,
} from '../types/incident';

// Base URL for the incidents API.
// Note: In Vite, we usually set up a proxy in vite.config.ts to forward '/api' to 'http://localhost:5000'
const API_URL = '/incidents';

/**
 * Fetch the list of all departments
 */
export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get<ApiResponse<Department[]>>(`/departments`);
  return response.data.data;
};

/**
 * Fetch all incidents for a specific department
 */
export const getDepartmentIncidents = async (departmentId: number): Promise<Incident[]> => {
  const response = await apiClient.get<ApiResponse<Incident[]>>(
    `${API_URL}/department/${departmentId}`
  );
  return response.data.data;
};

/**
 * Fetch analytics statistics for a specific department
 */
export const getDepartmentAnalytics = async (
  departmentId: number
): Promise<DepartmentAnalytics> => {
  const response = await apiClient.get<ApiResponse<DepartmentAnalytics>>(
    `/analytics/department/${departmentId}`
  );
  return response.data.data;
};

/**
 * Accept an OPEN incident
 */
export const acceptIncident = async (id: number): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(`${API_URL}/${id}/accept`);
  return response.data.data;
};

/**
 * Reject an OPEN incident with a reason
 */
export const rejectIncident = async (id: number, reason: string): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(`${API_URL}/${id}/reject`, {
    reason,
  });
  return response.data.data;
};

/**
 * Assign an investigator to an ACCEPTED incident
 */
export const assignInvestigator = async (id: number, investigatorId: number): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(
    `${API_URL}/${id}/assign-investigator`,
    { investigatorId }
  );
  return response.data.data;
};

/**
 * Assign an action owner to an INVESTIGATING incident
 */
export const assignActionOwner = async (id: number, actionOwnerId: number): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(
    `${API_URL}/${id}/assign-action-owner`,
    { actionOwnerId }
  );
  return response.data.data;
};

/**
 * Mark an incident as UNDER_REVIEW
 */
export const reviewIncident = async (id: number): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(`${API_URL}/${id}/review`);
  return response.data.data;
};

/**
 * Close the incident
 */
export const closeIncident = async (id: number): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(`${API_URL}/${id}/close`);
  return response.data.data;
};

/**
 * Submit a new incident report with optional evidence attachments
 */
export const createIncident = async (formData: FormData): Promise<Incident> => {
  const response = await apiClient.post<{ success: boolean; message: string; incident: Incident }>(
    `${API_URL}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.incident;
};

// Get incidents assigned to the investigator
export const getAssignedIncidents = async (): Promise<Incident[]> => {
  const response = await apiClient.get<ApiResponse<Incident[]>>(`${API_URL}/investigator`);
  return response.data.data;
};

// Feature 5 - Get incidents assigned to the logged-in Action Owner
export const getActionOwnerIncidents = async (): Promise<Incident[]> => {
  const response = await apiClient.get<ApiResponse<Incident[]>>(`${API_URL}/action-owner`);
  return response.data.data;
};

// Get a single incident by ID
export const getIncidentById = async (id: number): Promise<Incident> => {
  const response = await apiClient.get<ApiResponse<Incident>>(`${API_URL}/${id}`);
  return response.data.data;
};

/**
 * Fetch all users with a given role (e.g. INVESTIGATOR, ACTION_OWNER)
 */
export const getUsersByRole = async (role: string): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>(`/users/role/${role}`);
  return response.data.data;
};

// Feature 5 - Submit corrective action
export const submitCorrectiveAction = async (
  id: number,
  correctiveAction: string
): Promise<Incident> => {
  const response = await apiClient.patch<ApiResponse<Incident>>(
    `${API_URL}/${id}/corrective-action`,
    { correctiveAction }
  );
  return response.data.data;
};
