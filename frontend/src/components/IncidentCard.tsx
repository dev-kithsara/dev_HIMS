// frontend/src/components/IncidentCard.tsx

import React from 'react';
import type { Incident } from '../types/incident';

// ── Color Tokens ──────────────────────────────────────────────────────────
const SURFACE = '#F7F8FA';
const BORDER  = '#D8DCE8';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const FAINT   = '#9BA4BC';
const NAVY    = '#1E2B5E';

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OPEN:           { bg: '#EBF0FA', text: '#2952C4', border: '#C0CBE0' },
  ACCEPTED:       { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  REJECTED:       { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  INVESTIGATING:  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  PENDING_ACTION: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  IN_PROGRESS:    { bg: '#FDF4FF', text: '#9333EA', border: '#F3E8FF' },
  UNDER_REVIEW:   { bg: '#EBF0FA', text: '#0EA5E9', border: '#BAE6FD' },
  CLOSED:         { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
};

// Severity bar colors
const SEVERITY_COLORS: Record<string, { bar: string; bg: string; text: string; border: string }> = {
  LOW:      { bar: '#22C55E', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  MEDIUM:   { bar: '#EAB308', bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A' },
  HIGH:     { bar: '#F97316', bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  CRITICAL: { bar: '#EF4444', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick }) => {
  const status   = STATUS_COLORS[incident.status]   ?? { bg: '#F1F5F9', text: '#6B7494', border: '#CBD5E1' };
  const severity = SEVERITY_COLORS[incident.severity] ?? { bar: '#9BA4BC', bg: '#F1F5F9', text: '#6B7494', border: '#CBD5E1' };

  const formattedDate = new Date(incident.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 1px 6px rgba(17,17,132,0.06)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#C0CBE0';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(17,17,132,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = BORDER;
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(17,17,132,0.06)';
      }}
    >
      {/* Severity top bar */}
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: severity.bar }} />

      <div className="p-5 pt-6">
        {/* Title + Status Badge */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3
            className="text-sm font-bold truncate leading-snug"
            style={{ color: TEXT }}
          >
            {incident.title}
          </h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0"
            style={{ backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}` }}
          >
            {incident.status.replace(/_/g, ' ')}
          </span>
        </div>

        <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: MUTED }}>
          {incident.description}
        </p>
      </div>

      {/* Footer row */}
      <div
        className="flex justify-between items-center px-5 py-3 text-xs"
        style={{ borderTop: `1px solid ${BORDER}`, color: FAINT }}
      >
        <div className="flex items-center gap-2">
          <span>Reporter:</span>
          <span className="font-semibold" style={{ color: NAVY }}>
            {incident.reporter?.name || 'Unknown'}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
            style={{ backgroundColor: severity.bg, color: severity.text, border: `1px solid ${severity.border}` }}
          >
            {incident.severity}
          </span>
        </div>
        <div className="font-medium">{formattedDate}</div>
      </div>
    </div>
  );
};
