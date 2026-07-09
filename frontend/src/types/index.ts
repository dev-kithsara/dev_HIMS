// ── Core Entities ──────────────────────────────────────────────────────────
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'INVESTIGATING'
  | 'PENDING_ACTION'
  | 'UNDER_REVIEW'
  | 'CLOSED'
export type UserRole = 'admin' | 'department_manager' | 'investigator' | 'action_owner' | 'staff'

export interface User {
  id:          number
  name:        string
  email:       string
  role:        UserRole
  department?: string
  isActive:    boolean
  createdAt:   string
}

export interface Incident {
  id:                  number
  title:               string
  description:         string
  severity:            Severity
  category?:           string
  location?:           string
  department?:         string
  reportedBy?:         number
  reporter?:           { id: number; name: string; email: string }
  status:              IncidentStatus
  aiProcessed:         boolean
  predictedRiskScore?: number
  clusterId?:          number
  deletedAt?:          string
  isRejected?:         boolean
  rejectionComment?:   string | null
  createdAt:           string
  updatedAt:           string
  // lifecycle objects (populated by getById)
  actions?:            IncidentAction[]
  investigation?:      Investigation | null
  rootCause?:          RootCause | null
  controls?:           Control[]
  review?:             Review | null
  closure?:            Closure | null
}

export interface IncidentAction {
  id:          number
  incidentId:  number
  actionTaken: string
  assignedTo?: number
  assignee?:   { id: number; name: string }
  priority:    'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?:    string
  status:      'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  createdAt:   string
  updatedAt:   string
}

export interface Investigation {
  id:                 number
  incidentId:         number
  findings?:          string
  evidence?:          string
  evidenceFiles?:     string[]
  investigatedBy?:    number
  investigator?:      { id: number; name: string }
  investigationDate?: string
  createdAt:          string
  updatedAt:          string
}

export interface RootCause {
  id:                   number
  incidentId:           number
  rootCauseCategory:    string
  description:          string
  contributingFactors?: string
  causalChain?:         string
  createdAt:            string
  updatedAt:            string
}

export interface Control {
  id:                  number
  incidentId:          number
  controlType:         'Preventive' | 'Detective' | 'Corrective'
  description:         string
  owner?:              number
  controlOwner?:       { id: number; name: string }
  implementationDate?: string
  status:              'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VERIFIED'
  createdAt:           string
  updatedAt:           string
}

export interface Review {
  id:                   number
  incidentId:           number
  reviewerId?:          number
  reviewer?:            { id: number; name: string }
  reviewNotes?:         string
  effectivenessRating?: number
  reviewDate?:          string
  createdAt:            string
  updatedAt:            string
}

export interface Closure {
  id:              number
  incidentId:      number
  closureSummary:  string
  lessonsLearned?: string
  closedBy?:       number
  closer?:         { id: number; name: string }
  closureDate:     string
  createdAt:       string
  updatedAt:       string
}

// ── API Response Shapes ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; pages: number }
}

export interface Stats {
  total:          number
  open:           number
  accepted:       number
  investigating:  number
  pendingAction:  number
  underReview:    number
  closed:         number
  rejected:       number
  // legacy
  inProgress:     number
  bySeverity:     { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number }
  topCategories:  { category: string; count: number }[]
  recentIncidents: Pick<Incident, 'id' | 'title' | 'severity' | 'status' | 'createdAt'>[]
  overdueActions?:  (IncidentAction & { incident?: { id: number; title: string } })[]
  upcomingActions?: (IncidentAction & { incident?: { id: number; title: string } })[]
}

// ── AI ─────────────────────────────────────────────────────────────────────
export interface SimilarIncident {
  incident_id:      number
  title:            string
  severity:         Severity
  similarity_score: number
  category?:        string
}

export interface ClusterPoint {
  incident_id: number
  title:       string
  severity:    Severity
  category?:   string
  x:           number
  y:           number
  cluster:     number
}

export interface ClusterMap {
  clusters:        ClusterPoint[]
  cluster_labels:  Record<string, string>
  total_incidents: number
  num_clusters:    number
}

export interface ModelStatus {
  classifier_trained: boolean
  clustering_trained: boolean
  training_samples?:  number
  accuracy?:          number
  precision?:         number
  recall?:            number
  f1_score?:          number
  optimal_k?:         number
  silhouette_score?:  number
  trained_at?:        string
}

export interface RiskPrediction {
  risk_score:           number
  risk_label:           Severity
  confidence:           number
  contributing_factors: string[]
}

// ── Timeline ───────────────────────────────────────────────────────────────
export interface TimelineEvent {
  type: string
  date: string
  data: Record<string, unknown>
}

// ── Predictive Risk Analysis ───────────────────────────────────────────────
export interface RiskSummary {
  total_incidents: number
  avg_risk_score:  number
  critical_count:  number
  high_count:      number
  medium_count:    number
  low_count:       number
  open_incidents:  number
}

export interface MonthlyTrendPoint {
  month:    string
  LOW:      number
  MEDIUM:   number
  HIGH:     number
  CRITICAL: number
}

export interface DepartmentRisk {
  department:      string
  avg_risk_score:  number
  total_incidents: number
  critical_count:  number
}

export interface CategoryBreakdown {
  category:        string
  total:           number
  high_risk_count: number
  avg_risk_score:  number
}

export interface AtRiskIncident {
  id:          number
  title:       string
  severity:    Severity
  category?:   string
  department?: string
  risk_score:  number
  created_at?: string
  status:      string
}

export interface RiskAnalysis {
  summary:            RiskSummary
  monthly_trend:      MonthlyTrendPoint[]
  department_risk:    DepartmentRisk[]
  category_breakdown: CategoryBreakdown[]
  top_at_risk:        AtRiskIncident[]
}

// ── Chat ───────────────────────────────────────────────────────────────────
export interface ChatContact {
  id:          number
  name:        string
  email:       string
  role:        UserRole
  unreadCount: number
}

export interface ChatMessage {
  id:         number
  senderId:   number
  receiverId: number
  content:    string
  isRead:     boolean
  createdAt:  string
}
