import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useActionOwnerIncidents, useSubmitCorrectiveAction, } from '../hooks/useIncidents';

// ── Color Tokens ──────────────────────────────────────────────────────────
const NAVY    = '#1E2B5E';
const COBALT  = '#1B367A';
const ROYAL   = '#2952C4';
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const BORDER  = '#D8DCE8';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const FAINT   = '#9BA4BC';
const AMBER   = '#D97706';
const GREEN   = '#16A34A';

export const ActionOwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: incidents,
    isLoading,
    isError,
    error,
  } = useActionOwnerIncidents();

  const submitCorrectiveAction = useSubmitCorrectiveAction();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [correctiveAction, setCorrectiveAction] = useState('');

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return incidents;
    return incidents.filter((incident) =>
      incident.title.toLowerCase().includes(searchLower) ||
      incident.category.toLowerCase().includes(searchLower) ||
      incident.severity.toLowerCase().includes(searchLower) ||
      incident.location.toLowerCase().includes(searchLower)
    );
  }, [incidents, searchTerm]);

  const handleSubmit = async () => {
    if (!selectedIncidentId) return;
    if (correctiveAction.trim().length < 20) {
      alert('Corrective action must be at least 20 characters long.');
      return;
    }
    try {
      await submitCorrectiveAction.mutateAsync({
        incidentId: selectedIncidentId,
        correctiveAction: correctiveAction.trim(),
      });
      setCorrectiveAction('');
      setSelectedIncidentId(null);
      alert('Corrective action submitted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit corrective action.');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
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

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
        <h3 className="font-semibold text-red-600">Error loading incidents</h3>
        <p className="text-sm mt-1 text-red-500">
          {error instanceof Error ? error.message : 'Unknown error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #192651 60%, ${COBALT} 100%)`,
          boxShadow: '0 4px 24px rgba(17,17,132,0.18)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Action Owner Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Review assigned incidents and submit corrective actions.
            </p>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl w-full sm:w-64 outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.22)',
              color: '#FFFFFF',
            }}
            onFocus={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
          />
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Assigned Incidents', value: incidents?.length ?? 0, color: TEXT },
          { label: 'Pending Actions',    value: incidents?.filter(i => i.status === 'PENDING_ACTION').length ?? 0, color: AMBER },
          { label: 'Search Results',     value: filteredIncidents.length, color: ROYAL },
        ].map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-2xl"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: FAINT }}>
              {card.label}
            </p>
            <p className="text-3xl font-bold mt-2" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────── */}
      {filteredIncidents.length === 0 ? (
        <div
          className="p-12 rounded-2xl text-center flex flex-col items-center justify-center min-h-[280px]"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: BG_PAGE }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={FAINT}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold" style={{ color: TEXT }}>No pending actions</h3>
          <p className="text-sm mt-1 max-w-xs" style={{ color: MUTED }}>
            {searchTerm ? 'No incidents match your search.' : 'There are currently no incidents assigned to you.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-sm font-semibold hover:underline"
              style={{ color: ROYAL }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* ── Incident Grid ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 1px 6px rgba(17,17,132,0.06)' }}
            >
              {/* Incident Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/action-owner/incidents/${incident.id}`)}
                    className="text-sm font-bold leading-snug text-left hover:underline cursor-pointer"
                    style={{ color: TEXT }}
                  >
                    {incident.title}
                  </button>
                  <p className="text-xs mt-0.5" style={{ color: FAINT }}>
                    Incident #{incident.id}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{ backgroundColor: '#EBF0FA', color: NAVY, border: '1px solid #C0CBE0' }}
                >
                  {incident.status.replaceAll('_', ' ')}
                </span>
              </div>

              {/* Incident Info */}
              <div className="mt-4 space-y-1.5 text-xs">
                <p style={{ color: MUTED }}>
                  <span className="font-semibold" style={{ color: TEXT }}>Severity:</span>{' '}
                  {incident.severity}
                </p>
                <p style={{ color: MUTED }}>
                  <span className="font-semibold" style={{ color: TEXT }}>Category:</span>{' '}
                  {incident.category}
                </p>
                <p style={{ color: MUTED }}>
                  <span className="font-semibold" style={{ color: TEXT }}>Location:</span>{' '}
                  {incident.location}
                </p>
                {incident.investigator && (
                  <p style={{ color: MUTED }}>
                    <span className="font-semibold" style={{ color: TEXT }}>Investigator:</span>{' '}
                    {incident.investigator.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div
                className="mt-4 p-3 rounded-xl"
                style={{ backgroundColor: BG_PAGE, border: `1px solid ${BORDER}` }}
              >
                <p className="text-[11px] font-semibold mb-1" style={{ color: ROYAL }}>
                  Incident Description
                </p>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: MUTED }}>
                  {incident.description}
                </p>
              </div>

              {/* Corrective Action Form */}
              {selectedIncidentId === incident.id ? (
                <div className="mt-4">
                  <label htmlFor={`corrective-action-${incident.id}`} className="block text-xs font-semibold mb-2" style={{ color: TEXT }}>
                    Corrective Action
                  </label>
                  <textarea
                    id={`corrective-action-${incident.id}`}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="Describe the corrective action that will be taken..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{ backgroundColor: BG_PAGE, border: `1.5px solid ${BORDER}`, color: TEXT }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = ROYAL; e.currentTarget.style.boxShadow = '0 0 0 3px #EBF0FA'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: correctiveAction.trim().length < 20 ? AMBER : GREEN }}
                    >
                      {correctiveAction.trim().length}/20 minimum characters
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitCorrectiveAction.isPending}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white cursor-pointer"
                      style={{ backgroundColor: NAVY }}
                    >
                      {submitCorrectiveAction.isPending ? 'Submitting...' : 'Submit Action'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedIncidentId(null); setCorrectiveAction(''); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                      style={{ backgroundColor: BG_PAGE, color: MUTED, border: `1px solid ${BORDER}` }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setSelectedIncidentId(incident.id); setCorrectiveAction(''); }}
                  className="w-full mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-white cursor-pointer"
                  style={{ backgroundColor: NAVY, boxShadow: '0 2px 8px rgba(17,17,132,0.18)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = COBALT; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = NAVY; }}
                >
                  Submit Corrective Action
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionOwnerDashboard;