import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as incidentApi from '../api/incident.api';
import type { Incident, DepartmentAnalytics, Department, User } from '../types/incident';
import { getActionOwnerIncidents, submitCorrectiveAction } from '../api/incident.api';

// 0. Hook to fetch all users with a given role (e.g. INVESTIGATOR, ACTION_OWNER)
export const useUsersByRole = (role: string) => {
  return useQuery<User[]>({
    queryKey: ['users', 'role', role],
    queryFn: () => incidentApi.getUsersByRole(role),
    enabled: !!role,
  });
};

// 0. Hook to fetch the list of all departments
export const useDepartments = () => {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => incidentApi.getDepartments(),
  });
};

// 0. Hook to fetch department analytics summaries for the Manager Dashboard
export const useDepartmentAnalytics = (departmentId: number) => {
  return useQuery<DepartmentAnalytics>({
    queryKey: ['analytics', 'department', departmentId],
    queryFn: () => incidentApi.getDepartmentAnalytics(departmentId),
    enabled: !!departmentId,
  });
};

// 1. Hook to fetch all incidents for a department
export const useDepartmentIncidents = (departmentId: number) => {
  return useQuery({
    queryKey: ['incidents', 'department', departmentId],
    queryFn: () => incidentApi.getDepartmentIncidents(departmentId),
    enabled: !!departmentId,
  });
};

// 2. Hook to accept an incident
export const useAcceptIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incidentId: number) => incidentApi.acceptIncident(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 3. Hook to reject an incident
export const useRejectIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      incidentApi.rejectIncident(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 4. Hook to review an incident
export const useReviewIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incidentId: number) => incidentApi.reviewIncident(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 5. Hook to close an incident
export const useCloseIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incidentId: number) => incidentApi.closeIncident(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 6. Hook to assign an investigator to an incident
export const useAssignInvestigator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, investigatorId }: { id: number; investigatorId: number }) =>
      incidentApi.assignInvestigator(id, investigatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 7. Hook to assign an action owner to an incident
export const useAssignActionOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, actionOwnerId }: { id: number; actionOwnerId: number }) =>
      incidentApi.assignActionOwner(id, actionOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 8. Hook to submit a new incident (Staff Submission)
export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => incidentApi.createIncident(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
};

// 9. Hook to fetch incidents assigned to the investigator
export const useAssignedIncidents = () => {
  return useQuery<Incident[]>({
    queryKey: ['incidents', 'investigator'],
    queryFn: () => incidentApi.getAssignedIncidents(),
  });
};

// Get incidents assigned to the logged-in Action Owner
export const useActionOwnerIncidents = () => {
  return useQuery({
    queryKey: ['action-owner-incidents'],
    queryFn: getActionOwnerIncidents,
  });
};

// Submit corrective action for an incident
export const useSubmitCorrectiveAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentId,
      correctiveAction,
    }: {
      incidentId: number;
      correctiveAction: string;
    }) => submitCorrectiveAction(incidentId, correctiveAction),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['action-owner-incidents'],
      });
    },
  });
};

// Get a single incident
export const useIncident = (id: number) => {
  return useQuery<Incident>({
    queryKey: ['incident', id],
    queryFn: () => incidentApi.getIncidentById(id),
    enabled: !!id,
  });
};
