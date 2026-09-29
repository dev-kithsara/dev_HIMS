import { apiClient } from './axios';

export type Role = 'ADMIN' | 'MANAGER' | 'INVESTIGATOR' | 'ACTION_OWNER' | 'STAFF';

export interface AdminDepartment {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: { users: number; incidents: number };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  departmentId: number;
  department?: { id: number; name: string };
  isActive: boolean;
}

export interface AdminIncident {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  location: string;
  status: string;
  departmentId: number;
  department: AdminDepartment;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  createdAt: string;
  eventType: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorRole?: string;
  actor?: { name: string; email: string };
}

const data = <T>(response: { data: { data: T } }) => response.data.data;

export const adminApi = {
  overview: (params?: Record<string, string>) => apiClient.get('/admin/overview', { params }).then(data),
  incidents: (params?: Record<string, string>) => apiClient.get('/admin/incidents', { params }).then(data<AdminIncident[]>),
  correctIncident: (id: number, body: { reason: string; changes: Record<string, unknown> }) =>
    apiClient.patch(`/admin/incidents/${id}/correct`, body).then(data),
  users: () => apiClient.get('/admin/users').then(data<AdminUser[]>),
  createUser: (body: Record<string, unknown>) => apiClient.post('/admin/users', body).then(data),
  updateUser: (id: number, body: Record<string, unknown>) => apiClient.patch(`/admin/users/${id}`, body).then(data),
  deactivateUser: (id: number) => apiClient.patch(`/admin/users/${id}/deactivate`).then(data),
  departments: () => apiClient.get('/admin/departments').then(data<AdminDepartment[]>),
  createDepartment: (body: { name: string; description?: string }) => apiClient.post('/admin/departments', body).then(data),
  updateDepartment: (id: number, body: Record<string, unknown>) => apiClient.patch(`/admin/departments/${id}`, body).then(data),
  deactivateDepartment: (id: number) => apiClient.patch(`/admin/departments/${id}/deactivate`).then(data),
  auditLogs: (params?: Record<string, string>) => apiClient.get('/admin/audit-logs', { params }).then(data<AuditLog[]>),
  exportAuditLogs: (params?: Record<string, string>) => apiClient.get('/admin/audit-logs/export', { params, responseType: 'blob' }),
  dataQuality: () => apiClient.get('/admin/data-quality').then(data),
  configs: () => apiClient.get('/admin/config').then(data),
  saveConfig: (key: string, body: Record<string, unknown>) => apiClient.put(`/admin/config/${key}`, body).then(data),
  models: () => apiClient.get('/admin/models').then(data),
  modelHealth: () => apiClient.get('/admin/models/health').then(data),
  transitionModel: (id: number, action: string, reason: string) =>
    apiClient.post(`/admin/models/${id}/transition`, { action, reason }).then(data),
};

