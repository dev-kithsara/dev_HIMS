// frontend/src/components/IncidentActions.tsx

import React from 'react';
import type { Incident } from '../types/incident';
import { useAuthContext } from '../context/AuthContext';

// ── Color Tokens ──────────────────────────────────────────────────────────
const NAVY   = '#1E2B5E';
const ROYAL  = '#2952C4';
const BORDER = '#D8DCE8';
const MUTED  = '#6B7494';
const DANGER = '#EF4444';
const AMBER  = '#D97706';
const VIOLET = '#7C3AED';
const GREEN  = '#16A34A';


interface IncidentActionsProps {
  incident: Incident;
  onAccept?: () => void;
  onReject?: () => void;
  onAssignInvestigator?: () => void;
  onAssignActionOwner?: () => void;
  onReview?: () => void;
  onClose?: () => void;
}

const ActionBtn: React.FC<{
  label: string;
  onClick?: () => void;
  bg: string;
  textColor?: string;
}> = ({ label, onClick, bg, textColor = '#F7F8FA' }) => (
  <button
    onClick={onClick}
    className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer"
    style={{ backgroundColor: bg, color: textColor, boxShadow: `0 2px 8px ${bg}40` }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
  >
    {label}
  </button>
);

export const IncidentActions: React.FC<IncidentActionsProps> = ({
  incident, onAccept, onReject, onAssignInvestigator,
  onAssignActionOwner, onReview, onClose,
}) => {
  const { user } = useAuthContext();
  const isManager = user?.role === 'MANAGER';

  const renderButtons = () => {
    if (!isManager) {
      return (
        <p className="text-sm italic" style={{ color: MUTED }}>
          You do not have permission to perform workflow actions on this incident.
        </p>
      );
    }

    switch (incident.status) {
      case 'OPEN':
        return (
          <>
            <ActionBtn label="Accept Incident"  onClick={onAccept} bg={GREEN} />
            <ActionBtn label="Reject Incident"  onClick={onReject} bg={DANGER} />
          </>
        );
      case 'ACCEPTED':
        return <ActionBtn label="Assign Investigator" onClick={onAssignInvestigator} bg={ROYAL} />;
      case 'INVESTIGATING':
        return <ActionBtn label="Assign Action Owner" onClick={onAssignActionOwner} bg={AMBER} />;
      case 'PENDING_ACTION':
        return <ActionBtn label="Mark as Under Review" onClick={onReview} bg={VIOLET} />;
      case 'UNDER_REVIEW':
        return <ActionBtn label="Close Incident" onClick={onClose} bg={NAVY} />;
      case 'CLOSED':
      case 'REJECTED':
        return (
          <p className="text-sm italic" style={{ color: MUTED }}>
            No further actions can be taken on this incident.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-wrap gap-3 mt-6 pt-6"
      style={{ borderTop: `1px solid ${BORDER}` }}
    >
      {renderButtons()}
    </div>
  );
};

export default IncidentActions;