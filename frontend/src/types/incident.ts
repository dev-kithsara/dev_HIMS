// 1. Define the possible status values exactly as they are in the Backend Prisma Enum
export type IncidentStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'INVESTIGATING'
  | 'PENDING_ACTION'
  | 'UNDER_REVIEW'
  | 'CLOSED';

// 2. Define a minimal User interface for the related data (reporter, investigator, etc.)
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  departmentId?: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface IncidentAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
}

// 3. Define the main Incident interface matching the Backend response
export interface Incident {
  id: number;
  title: string;
  description: string;

  severity: string;
  category: string;
  location: string;

  status: IncidentStatus;

  rejectionReason?: string;

  rootCause?: string;
  rootCauseCategory?: string;
  correctiveAction?: string;

  departmentId: number;
  reporterId: number;
  investigatorId?: number;
  actionOwnerId?: number;

  createdAt: string;
  updatedAt: string;

  reporter?: User;
  investigator?: User;
  actionOwner?: User;

  department?: Department;
  attachments?: IncidentAttachment[];
}

// 4. Define a generic API Response interface to match our Backend standard response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface DepartmentStats {
  summary: {
    total: number;
    open: number;
    critical: number;
    closed: number;
  };
  charts: {
    byStatus: ChartDataPoint[];
    bySeverity: ChartDataPoint[];
  };
}

export type DepartmentAnalytics = DepartmentStats;
