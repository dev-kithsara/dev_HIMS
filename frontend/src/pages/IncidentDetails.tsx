// frontend/src/pages/IncidentDetails.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  useDepartmentIncidents,
  useAcceptIncident,
  useReviewIncident,
  useCloseIncident,
  useRejectIncident,
  useAssignInvestigator,
  useAssignActionOwner,
} from '../hooks/useIncidents';

import { IncidentActions } from '../components/IncidentActions';
import { RejectModal } from '../components/RejectModal';
import { AssignUserModal } from '../components/AssignUserModal';
import { useAuthContext } from '../context/AuthContext';
import { useUsersByRole } from '../hooks/useIncidents';

// ── Color Tokens ───────────────────────────────────────────────────────────


const ROYAL = '#2952C4';
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const BORDER = '#D8DCE8';
const TEXT = '#1A2447';
const MUTED = '#6B7494';
const FAINT = '#9BA4BC';
const ACCENT = '#2952C4';

// Status badge map
const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  OPEN: { bg: '#EBF0FA', color: '#2952C4', border: '#C0CBE0' },
  ACCEPTED: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  REJECTED: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  INVESTIGATING: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  PENDING_ACTION: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  IN_PROGRESS: { bg: '#FDF4FF', color: '#9333EA', border: '#F3E8FF' },
  UNDER_REVIEW: { bg: '#EBF0FA', color: '#0EA5E9', border: '#BAE6FD' },
  CLOSED: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
};

export const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const departmentId = user?.departmentId ?? 1;

  const { data: incidents, isLoading } = useDepartmentIncidents(departmentId);
  const incident = incidents?.find((inc) => inc.id === Number(id));

  const acceptMutation = useAcceptIncident();
  const reviewMutation = useReviewIncident();
  const closeMutation = useCloseIncident();
  const rejectMutation = useRejectIncident();
  const assignInvestigatorMutation = useAssignInvestigator();
  const assignActionOwnerMutation = useAssignActionOwner();

  const { data: investigators = [] } = useUsersByRole('INVESTIGATOR');
  const { data: actionOwners = [] } = useUsersByRole('ACTION_OWNER');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isInvestigatorModalOpen, setIsInvestigatorModalOpen] = useState(false);
  const [isActionOwnerModalOpen, setIsActionOwnerModalOpen] = useState(false);

  const handleAccept = () => {
    if (window.confirm('Are you sure you want to accept this incident?')) {
      acceptMutation.mutate(Number(id));
    }
  };
  const handleReview = () => {
    if (window.confirm('Mark this incident as under review?')) {
      reviewMutation.mutate(Number(id));
    }
  };
  const handleClose = () => {
    if (
      window.confirm('Are you sure you want to close this incident? This action cannot be undone.')
    ) {
      closeMutation.mutate(Number(id));
    }
  };
  const handleConfirmReject = (reason: string) => {
    rejectMutation.mutate(
      { id: Number(id), reason },
      { onSuccess: () => setIsRejectModalOpen(false) }
    );
  };
  const handleConfirmInvestigator = (userId: number) => {
    assignInvestigatorMutation.mutate(
      { id: Number(id), investigatorId: userId },
      { onSuccess: () => setIsInvestigatorModalOpen(false) }
    );
  };
  const handleConfirmActionOwner = (userId: number) => {
    assignActionOwnerMutation.mutate(
      { id: Number(id), actionOwnerId: userId },
      { onSuccess: () => setIsActionOwnerModalOpen(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-10 w-10 border-[3px] border-t-transparent"
          style={{ borderColor: `${ROYAL} transparent ${ROYAL} ${ROYAL}` }}
        />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#EF4444' }}>
          Incident not found
        </h2>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm font-semibold hover:underline"
          style={{ color: ACCENT }}
        >
          &larr; Go back to Dashboard
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[incident.status] ?? {
    bg: '#F1F5F9',
    color: MUTED,
    border: '#CBD5E1',
  };

  return (
    <div className="min-h-screen p-2 sm:p-4" style={{ color: TEXT }}>
      <div
        className="max-w-4xl mx-auto rounded-2xl p-6"
        style={{
          backgroundColor: SURFACE,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 2px 12px rgba(17,17,132,0.07)',
        }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          style={{ color: ACCENT }}
        >
          &larr; Back to Dashboard
        </button>

        {/* Header */}
        <div className="pb-5 mb-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <h1 className="text-2xl font-bold" style={{ color: TEXT }}>
              {incident.title}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`,
              }}
            >
              {incident.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: MUTED }}>
            Reported on: {new Date(incident.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-2" style={{ color: TEXT }}>
            Description
          </h3>
          <p
            className="text-sm p-4 rounded-xl whitespace-pre-wrap leading-relaxed"
            style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}`, color: MUTED }}
          >
            {incident.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Severity', value: incident.severity },
            { label: 'Category', value: incident.category },
            { label: 'Location', value: incident.location },
            { label: 'Department', value: incident.department?.name || 'Not Available' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="p-4 rounded-xl"
              style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}
            >
              <h4
                className="text-[11px] font-bold uppercase tracking-wider mb-1"
                style={{ color: FAINT }}
              >
                {label}
              </h4>
              <p className="font-semibold text-sm" style={{ color: TEXT }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* People Involved */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#EBF0FA', border: '1px solid #C0CBE0' }}
          >
            <h4
              className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: '#2952C4' }}
            >
              Reporter
            </h4>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>
              {incident.reporter?.name || 'Unknown'}
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}
          >
            <h4
              className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: '#7C3AED' }}
            >
              Investigator
            </h4>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>
              {incident.investigator?.name || 'Not assigned'}
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
          >
            <h4
              className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: '#0369A1' }}
            >
              Action Owner
            </h4>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>
              {incident.actionOwner?.name || 'Not assigned'}
            </p>
          </div>
        </div>

        {/* Root Cause */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3" style={{ color: TEXT }}>
            Root Cause Analysis
          </h3>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-sm mb-2" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: TEXT }}>
                Category:{' '}
              </span>
              {incident.rootCauseCategory || 'Not submitted'}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: TEXT }}>
              Root Cause:
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              {incident.rootCause || 'No root cause analysis submitted yet.'}
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3" style={{ color: TEXT }}>
            Attachments
          </h3>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}
          >
            {incident.attachments && incident.attachments.length > 0 ? (
              <ul className="space-y-2">
                {incident.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex justify-between items-center text-sm pb-2"
                    style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT }}
                  >
                    <span>{file.fileName}</span>
                    <button
                      type="button"
                      className="font-semibold hover:underline text-xs cursor-pointer"
                      style={{ color: ACCENT }}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: MUTED }}>
                No attachments uploaded.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <IncidentActions
          incident={incident}
          onAccept={handleAccept}
          onReview={handleReview}
          onClose={handleClose}
          onReject={() => setIsRejectModalOpen(true)}
          onAssignInvestigator={() => setIsInvestigatorModalOpen(true)}
          onAssignActionOwner={() => setIsActionOwnerModalOpen(true)}
        />

        {(acceptMutation.isPending || reviewMutation.isPending || closeMutation.isPending) && (
          <div className="mt-4 text-sm font-medium animate-pulse" style={{ color: ACCENT }}>
            Processing action, please wait...
          </div>
        )}
      </div>

      {/* Modals */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        isLoading={rejectMutation.isPending}
      />
      <AssignUserModal
        isOpen={isInvestigatorModalOpen}
        onClose={() => setIsInvestigatorModalOpen(false)}
        onConfirm={handleConfirmInvestigator}
        isLoading={assignInvestigatorMutation.isPending}
        title="Assign Investigator"
        description="Select an investigator to find the root cause of this incident."
        availableUsers={investigators}
      />
      <AssignUserModal
        isOpen={isActionOwnerModalOpen}
        onClose={() => setIsActionOwnerModalOpen(false)}
        onConfirm={handleConfirmActionOwner}
        isLoading={assignActionOwnerMutation.isPending}
        title="Assign Action Owner"
        description="Select an action owner to implement corrective actions."
        availableUsers={actionOwners}
      />
    </div>
  );
};
