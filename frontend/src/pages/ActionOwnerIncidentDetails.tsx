import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useIncident,
  useSubmitCorrectiveAction,
} from '../hooks/useIncidents';
import toast from 'react-hot-toast';

// ── KAIROS Blue Palette ───────────────────────────────────────────────────
const NAVY    = '#1E2B5E';
const ROYAL   = '#2952C4';
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const BORDER  = '#D8DCE8';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const FAINT   = '#9BA4BC';
const GREEN   = '#16A34A';
const AMBER   = '#D97706';

const ActionOwnerIncidentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const incidentId = Number(id);

  const {
    data: incident,
    isLoading,
    isError,
    error,
  } = useIncident(incidentId);

  const submitCorrectiveAction = useSubmitCorrectiveAction();

  const [correctiveAction, setCorrectiveAction] = useState('');

  const handleSubmit = async () => {
    if (!incident) return;

    if (correctiveAction.trim().length < 20) {
      toast.error('Corrective action must be at least 20 characters long.');
      return;
    }

    try {
      await submitCorrectiveAction.mutateAsync({
        incidentId: incident.id,
        correctiveAction: correctiveAction.trim(),
      });

      toast.success('Corrective action submitted successfully.');
      navigate('/action-owner');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to submit corrective action.'
      );
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-11 w-11 border-[3px] border-t-transparent"
          style={{ borderColor: `${ROYAL} transparent ${ROYAL} ${ROYAL}` }}
        />
      </div>
    );
  }

  // Error
  if (isError || !incident) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
        <h3 className="font-semibold text-red-600">Error loading incident</h3>
        <p className="text-sm mt-1 text-red-500">
          {error instanceof Error ? error.message : 'Incident not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
        >
          <button
            type="button"
            onClick={() => navigate('/action-owner')}
            className="text-sm mb-4 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: ROYAL }}
          >
            &larr; Back to Action Owner Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: FAINT }}>
                Incident #{incident.id}
              </p>
              <h1 className="text-2xl font-bold mt-1" style={{ color: TEXT }}>
                {incident.title}
              </h1>
            </div>

            <span
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider w-fit"
              style={{ backgroundColor: '#EBF0FA', color: NAVY, border: '1px solid #C0CBE0' }}
            >
              {incident.status.replaceAll('_', ' ')}
            </span>
          </div>
        </div>

        {/* Incident Details */}
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
        >
          <h2 className="text-base font-bold mb-5" style={{ color: TEXT }}>Incident Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Severity', value: incident.severity },
              { label: 'Category', value: incident.category },
              { label: 'Location', value: incident.location },
              { label: 'Reporter', value: incident.reporter?.name || 'Not available' },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl" style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: FAINT }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: TEXT }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ROYAL }}>
              Incident Description
            </p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              {incident.description}
            </p>
          </div>
        </div>

        {/* Investigator Findings */}
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
        >
          <h2 className="text-base font-bold mb-5" style={{ color: TEXT }}>Investigator Findings</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: FAINT }}>Root Cause Category</p>
              <p className="text-sm font-semibold" style={{ color: TEXT }}>{incident.rootCauseCategory || 'Not provided'}</p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ROYAL }}>Root Cause Findings</p>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                {incident.rootCause || 'No investigator findings available.'}
              </p>
            </div>

            {incident.investigator && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#7C3AED' }}>Investigator</p>
                <p className="text-sm font-semibold" style={{ color: TEXT }}>{incident.investigator.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Corrective Action */}
        <div
          className="p-6 rounded-2xl"
          style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
        >
          <h2 className="text-base font-bold" style={{ color: TEXT }}>Corrective Action</h2>
          <label htmlFor="action-owner-corrective-action" className="block text-sm mt-1 mb-4" style={{ color: MUTED }}>
            Describe the corrective action that will be taken to prevent this incident from happening again.
          </label>

          <textarea
            id="action-owner-corrective-action"
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            placeholder="Enter corrective action details..."
            rows={7}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{ backgroundColor: BG_PAGE, border: `1.5px solid ${BORDER}`, color: TEXT }}
            onFocus={(e) => { e.currentTarget.style.borderColor = ROYAL; e.currentTarget.style.boxShadow = '0 0 0 3px #EBF0FA'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
          />

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: FAINT }}>Minimum 20 characters</p>
            <p
              className="text-xs font-semibold"
              style={{ color: correctiveAction.trim().length >= 20 ? GREEN : AMBER }}
            >
              {correctiveAction.trim().length} characters
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitCorrectiveAction.isPending || correctiveAction.trim().length < 20}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white cursor-pointer"
              style={{ backgroundColor: NAVY, boxShadow: '0 2px 8px rgba(17,17,132,0.20)' }}
            >
              {submitCorrectiveAction.isPending ? 'Submitting...' : 'Submit Corrective Action'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/action-owner')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ backgroundColor: BG_PAGE, color: MUTED, border: `1px solid ${BORDER}` }}
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActionOwnerIncidentDetails;