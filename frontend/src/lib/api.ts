import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import type {
  Incident, IncidentAction, Investigation, RootCause,
  Control, Review, Closure, User, Stats,
  PaginatedResponse, SimilarIncident, ClusterMap,
  ModelStatus, RiskPrediction, TimelineEvent, RiskAnalysis,
  ChatContact, ChatMessage
} from '@/types'

// ── Axios instance ─────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL ?? '') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (data: Partial<User> & { password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  me:       () => api.get<{ user: User }>('/auth/me'),
}

// ── Incidents ──────────────────────────────────────────────────────────────
export interface IncidentListParams {
  page?: number; limit?: number; search?: string
  status?: string; severity?: string; department?: string; category?: string
}

export const incidentsApi = {
  list:   (params?: IncidentListParams) =>
    api.get<{ data: Incident[]; meta: PaginatedResponse<Incident>['meta'] }>('/incidents', { params }),
  create: (data: Partial<Incident>) =>
    api.post<{ data: Incident }>('/incidents', data),
  get:    (id: number) =>
    api.get<{ data: Incident }>(`/incidents/${id}`),
  update: (id: number, data: Partial<Incident>) =>
    api.put<{ data: Incident }>(`/incidents/${id}`, data),
  delete: (id: number) =>
    api.delete(`/incidents/${id}`),
  export: (params?: IncidentListParams) =>
    api.get('/incidents/export', { params, responseType: 'blob' }),
  getLessonsLearned: (search?: string) =>
    api.get<{ data: Incident[] }>('/incidents/lessons-learned', { params: { search } }),

  // Actions
  addAction:    (id: number, data: Partial<IncidentAction>) =>
    api.post<{ data: IncidentAction }>(`/incidents/${id}/actions`, data),
  getActions:   (id: number) =>
    api.get<{ data: IncidentAction[] }>(`/incidents/${id}/actions`),
  updateAction: (id: number, aId: number, data: Partial<IncidentAction>) =>
    api.put<{ data: IncidentAction }>(`/incidents/${id}/actions/${aId}`, data),

  // Investigation
  addInvestigation: (id: number, data: Partial<Investigation>) =>
    api.post<{ data: Investigation }>(`/incidents/${id}/investigation`, data),
  getInvestigation: (id: number) =>
    api.get<{ data: Investigation | null }>(`/incidents/${id}/investigation`),
  uploadEvidence:   (id: number, data: FormData) =>
    api.post<{ data: string[] }>(`/incidents/${id}/upload-evidence`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Root Cause
  addRootCause: (id: number, data: Partial<RootCause>) =>
    api.post<{ data: RootCause }>(`/incidents/${id}/root-cause`, data),
  getRootCause: (id: number) =>
    api.get<{ data: RootCause | null }>(`/incidents/${id}/root-cause`),

  // Controls
  addControl:  (id: number, data: Partial<Control>) =>
    api.post<{ data: Control }>(`/incidents/${id}/controls`, data),
  getControls: (id: number) =>
    api.get<{ data: Control[] }>(`/incidents/${id}/controls`),

  // Review
  addReview:  (id: number, data: Partial<Review>) =>
    api.post<{ data: Review }>(`/incidents/${id}/review`, data),
  getReview:  (id: number) =>
    api.get<{ data: Review | null }>(`/incidents/${id}/review`),

  // Close
  close:      (id: number, data: Partial<Closure>) =>
    api.post<{ data: Closure; message: string }>(`/incidents/${id}/close`, data),
  getClosure: (id: number) =>
    api.get<{ data: Closure | null }>(`/incidents/${id}/close`),

  // Timeline
  getTimeline: (id: number) =>
    api.get<{ data: TimelineEvent[] }>(`/incidents/${id}/timeline`),

  // Analytics
  getRootCauseAnalytics: (params?: { startDate?: string; endDate?: string; department?: string; severity?: string }) =>
    api.get<{ data: any }>('/incidents/root-cause-analytics', { params }),
  getControlEffectiveness: () =>
    api.get<{ data: any[] }>('/incidents/control-effectiveness'),

  // ── NEW: Lifecycle transitions ─────────────────────────────────────────
  acceptIncident:     (id: number) =>
    api.post<{ data: Incident; message: string }>(`/incidents/${id}/accept`),
  rejectIncident:     (id: number, comment: string) =>
    api.post<{ data: Incident; message: string }>(`/incidents/${id}/reject`, { comment }),
  assignInvestigator: (id: number, investigatorId: number) =>
    api.post<{ data: Incident; message: string }>(`/incidents/${id}/assign-investigator`, { investigatorId }),
  assignActionOwner:  (id: number, actionOwnerId: number, actionDescription?: string) =>
    api.post<{ data: Incident; message: string }>(`/incidents/${id}/assign-action-owner`, { actionOwnerId, actionDescription }),
}

// ── Stats ──────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get<{ data: Stats }>('/stats'),
}

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  list:              () => api.get<{ data: User[] }>('/users'),
  listInvestigators: () => api.get<{ data: User[] }>('/users/investigators'),
  listActionOwners:  () => api.get<{ data: User[] }>('/users/action-owners'),
  updateMe:          (data: { name?: string; email?: string }) =>
    api.put<{ data: User }>('/users/me', data),
  changePass:        (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
  create:            (data: Partial<User> & { password: string }) =>
    api.post<{ data: User }>('/users', data),
  updateRole:        (id: number, role: string, department?: string) =>
    api.put<{ data: User }>(`/users/${id}/role`, { role, department }),
}

// ── AI ─────────────────────────────────────────────────────────────────────
export const aiApi = {
  similar:      (incidentId: number, topK = 5) =>
    api.get<{ source_incident_id: number; similar_incidents: SimilarIncident[]; processing_time_ms: number }>(
      '/ai/similar-incidents', { params: { incident_id: incidentId, top_k: topK } }
    ),
  clusterMap:   () => api.get<ClusterMap>('/ai/cluster-map'),
  predictRisk:  (data: { title: string; description: string; category?: string; department?: string }) =>
    api.post<RiskPrediction>('/ai/predict-risk', data),
  clusterStats: () => api.get('/ai/cluster-stats'),
  modelStatus:  () => api.get<ModelStatus>('/ai/model-status'),
  health:       () => api.get('/ai/health'),
  riskAnalysis: () => api.get<RiskAnalysis>('/ai/risk-analysis'),
  runPipeline:  () => api.post('/ai/run-pipeline'),
  seedBaseline: () => api.post('/ai/seed-baseline'),
  recommendLessons: (data: { title: string; description: string; category?: string; department?: string }) =>
    api.post<{ recommendations: any[] }>('/ai/lessons-learned/recommend', data),
}

// ── Chat ───────────────────────────────────────────────────────────────────
export const chatApi = {
  getContacts: () =>
    api.get<{ data: ChatContact[] }>('/chat/contacts'),
  getMessages: (contactId: number) =>
    api.get<{ data: ChatMessage[] }>(`/chat/messages/${contactId}`),
  sendMessage: (receiverId: number, content: string) =>
    api.post<{ data: ChatMessage }>('/chat/messages', { receiverId, content }),
  markAsRead: (senderId: number) =>
    api.put(`/chat/messages/${senderId}/read`),
}
