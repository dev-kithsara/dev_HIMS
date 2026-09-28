import { useMemo } from "react";
import { IncidentCard } from '../components/IncidentCard';
import { useAssignedIncidents } from '../hooks/useIncidents';
import { useNavigate } from 'react-router-dom';
import type { Incident } from "../types/incident";
import { Inbox } from 'lucide-react';

// ── Color Tokens ──────────────────────────────────────────────────────────
const NAVY    = '#1E2B5E';
const COBALT  = '#1B367A';
const ROYAL   = '#2952C4';
const SURFACE = '#F7F8FA';
const BORDER  = '#D8DCE8';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';

const InvestigatorDashboard = () => {
  const navigate = useNavigate();
  const {
    data: incidents,
    isLoading,
    isError,
    error,
  } = useAssignedIncidents();

  const stats = useMemo(() => {
    const count = incidents?.length ?? 0;
    const activeCount = incidents?.filter((incident) =>
      ['OPEN', 'ACCEPTED', 'INVESTIGATING', 'PENDING_ACTION'].includes(incident.status)
    ).length ?? 0;
    const reviewCount = incidents?.filter((incident) =>
      ['UNDER_REVIEW', 'CLOSED'].includes(incident.status)
    ).length ?? 0;
    return { count, activeCount, reviewCount };
  }, [incidents]);

  const handleIncidentClick = (incident: Incident) => {
    navigate(`/investigator/${incident.id}`, { state: { incident } });
  };

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

  if (isError) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
        <h2 className="font-bold text-red-600">Unable to load incidents</h2>
        <p className="mt-1 text-sm text-red-500">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="space-y-6 pb-6">
        <div
          className="p-8 rounded-2xl text-center"
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #192651 60%, ${COBALT} 100%)`,
            boxShadow: '0 4px 24px rgba(30,43,94,0.18)',
          }}
        >
          <span
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-white/90"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            Investigator Workspace
          </span>
          <h1 className="text-3xl font-bold text-white">Investigator Dashboard</h1>
          <p className="mt-2 text-sm text-white/70">
            Review and resolve the incidents assigned to you.
          </p>
        </div>

        <div
          className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border"
          style={{ backgroundColor: SURFACE, borderColor: BORDER }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: TEXT }}>
            No assigned incidents found
          </h3>
          <p className="mt-2 max-w-md text-sm" style={{ color: MUTED }}>
            Incidents assigned to you by a department manager will appear here for root cause analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* ── Header Banner ──────────────────────────────────────────────────── */}
      <section
        className="overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #192651 60%, ${COBALT} 100%)`,
          boxShadow: '0 4px 24px rgba(30,43,94,0.18)',
        }}
      >
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span
              className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
            >
              Investigator Workspace
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Assigned Incidents</h1>
            <p className="mt-1.5 max-w-xl text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Review and resolve the incidents currently assigned to you.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',  value: stats.count },
              { label: 'Active', value: stats.activeCount },
              { label: 'Review', value: stats.reviewCount },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Incident Queue ─────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-6"
        style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold" style={{ color: TEXT }}>Incident Queue</h2>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            Click any incident to view the full investigation details.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onClick={() => handleIncidentClick(incident)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default InvestigatorDashboard;