import { apiClient } from './axios';
import type { Incident, User } from '../types/incident';

export interface ManagerDashboardData {
  summary: { submitted: number; investigating: number; actionOverdue: number; reviewPending: number; highRisk: number; closed: number; total: number };
  frequencyTrend: { name: string; value: number }[];
  rootCauseDistribution: { name: string; value: number }[];
  controlEffectiveness: { name: string; value: number }[];
  averageResolutionHours: number;
  severityAccuracy: { matched: number; underRated: number; overRated: number };
  ageing: { name: string; value: number }[];
  queues: { submitted: Incident[]; reviewPending: Incident[]; overdueActions: ManagerAction[] };
}

export interface ManagerAction {
  id: number; title: string; description: string; type: 'CORRECTIVE' | 'PREVENTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate: string; ownerId: number; owner?: User; completedAt?: string;
}

export interface ManagerIncident extends Incident {
  managerDecisionComment?: string;
  investigationReviewStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  investigationReviewComment?: string;
  originalSeverity?: string;
  closureSummary?: string; closedAt?: string; reopenReason?: string; reopenCount?: number;
  actionItems: ManagerAction[];
  controls: Array<{ id: number; controlType: string; effectiveness: string; failureReason?: string; improvementPlan?: string; status: string; dueDate?: string; owner?: User }>;
  reviews: Array<{ id: number; outcome: string; comments: string; lessonsLearned?: string; followUpDetails?: string; reviewedAt: string; reviewer?: User }>;
  lessons: Array<{ id: number; audience: string; scheduledFor?: string; status: string }>;
  predictiveRisk: { score: number; calculatedLevel: string; effectiveLevel: string; confidence: number; modelVersion: string; keyFactors: string[] };
}

export interface IncidentQuery {
  page?: number; pageSize?: number; search?: string; status?: string; severity?: string; category?: string;
  location?: string; reporter?: string; owner?: string; from?: string; to?: string; sortBy?: string; sortOrder?: string;
}

const data = <T>(response: { data: { data: T } }) => response.data.data;
export const managerApi = {
  dashboard: async () => data<ManagerDashboardData>(await apiClient.get('/manager/dashboard')),
  incidents: async (params: IncidentQuery) => data<{ items: Incident[]; page: number; pageSize: number; total: number; totalPages: number }>(await apiClient.get('/manager/incidents', { params })),
  incident: async (id: number) => data<ManagerIncident>(await apiClient.get(`/manager/incidents/${id}`)),
  candidates: async (role: 'investigator' | 'action-owner') => data<User[]>(await apiClient.get(`/manager/candidates/${role}`)),
  export: async (params: IncidentQuery) => (await apiClient.get('/manager/incidents/export', { params, responseType: 'blob' })).data as Blob,
  decide: (id: number, body: unknown) => apiClient.patch(`/manager/incidents/${id}/decision`, body),
  edit: (id: number, body: unknown) => apiClient.patch(`/manager/incidents/${id}`, body),
  assignInvestigator: (id: number, investigatorId: number) => apiClient.post(`/manager/incidents/${id}/assign-investigator`, { investigatorId }),
  reviewInvestigation: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/investigation-review`, body),
  createAction: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/actions`, body),
  updateAction: (id: number, actionId: number, body: unknown) => apiClient.patch(`/manager/incidents/${id}/actions/${actionId}`, body),
  addControl: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/controls`, body),
  addReview: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/reviews`, body),
  addLesson: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/lessons`, body),
  close: (id: number, closureSummary: string) => apiClient.post(`/manager/incidents/${id}/close`, { closureSummary }),
  reopen: (id: number, reason: string) => apiClient.post(`/manager/incidents/${id}/reopen`, { reason }),
  overrideRisk: (id: number, body: unknown) => apiClient.post(`/manager/incidents/${id}/risk-override`, body),
  recommendations: async (id: number) => data<any>(await apiClient.get(`/manager/incidents/${id}/recommendations`)),
};
