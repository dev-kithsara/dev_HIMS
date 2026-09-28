import React from 'react';
import { Inbox } from 'lucide-react';

// ── KAIROS Clinical Palette ────────────────────────────────────────────────
const PANEL = '#0E1720';
const TEXT = '#EEF7FC';
const TEAL = '#45A79A';
const MUTED = '#8FA8B4';
const BORDER = '#253642';
const DANGER = '#EF4444';

const STATS = [
  { label: 'Total Incidents', value: 0, color: TEAL },
  { label: 'Open', value: 0, color: DANGER },
  { label: 'Investigating', value: 0, color: '#F59E0B' },
  { label: 'Closed', value: 0, color: '#22C55E' },
];

const MyIncidentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        className="p-6 rounded-xl border"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: TEXT }}>
          My Incidents
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          View and track the incidents you have reported.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-xl border"
            style={{ backgroundColor: PANEL, borderColor: BORDER }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: MUTED }}
            >
              {stat.label}
            </p>
            <h2 className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Incidents Section */}
      <div
        className="rounded-xl border"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}
      >
        <div className="p-6 border-b" style={{ borderColor: BORDER }}>
          <h2 className="text-lg font-semibold" style={{ color: TEXT }}>
            Reported Incidents
          </h2>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            Incidents submitted by you.
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${TEAL}1A`, color: TEAL }}
          >
            <Inbox className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-semibold" style={{ color: TEXT }}>
            No incidents found
          </h3>

          <p className="mt-2 max-w-md text-sm" style={{ color: MUTED }}>
            You have not reported any incidents yet. Once you submit an
            incident, it will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyIncidentsPage;