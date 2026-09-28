import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useDepartmentAnalytics } from '../hooks/useIncidents';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Color Palette ─────────────────────────────────────────────────────────
const NAVY       = '#1E2B5E';
const ROYAL      = '#2952C4';
const TRUE_BLUE  = '#5485E0';
const TEXT_PRI   = '#1A2447';
const TEXT_MUT   = '#6B7494';
const SURFACE    = '#F7F8FA';
const BORDER     = '#D8DCE8';

// Colors for the Pie Chart (Status)
const STATUS_COLORS: Record<string, string> = {
  OPEN:           '#5485E0',
  ACCEPTED:       '#10B981',
  INVESTIGATING:  '#8B5CF6',
  PENDING_ACTION: '#F59E0B',
  UNDER_REVIEW:   '#0EA5E9',
  CLOSED:         '#22C55E',
  REJECTED:       '#EF4444',
};

// Colors for the Bar Chart (Severity)
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH:     '#F97316',
  MEDIUM:   '#EAB308',
  LOW:      '#22C55E',
};

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const departmentId = user?.departmentId ?? 1;

  const {
    data: stats,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError,
  } = useDepartmentAnalytics(departmentId);

  if (isAnalyticsLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div
          className="animate-spin rounded-full h-12 w-12 border-[3px] border-t-transparent"
          style={{ borderColor: `${ROYAL} transparent ${ROYAL} ${ROYAL}` }}
        />
      </div>
    );
  }

  if (isAnalyticsError || !stats) {
    return (
      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
      >
        <h3 className="font-bold text-red-600 text-lg">Error loading analytics data</h3>
        <p className="text-base mt-1 text-red-500">
          {analyticsError instanceof Error ? analyticsError.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  // ── KPI card definitions ────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Incidents',
      value: stats.summary.total,
      sub: 'All recorded incidents',
      iconBg: '#EBF0FA',
      iconColor: NAVY,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      label: 'Open & Pending',
      value: stats.summary.open,
      sub: 'Requires triage attention',
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
    },
    {
      label: 'Critical Severity',
      value: stats.summary.critical,
      sub: 'Highest priority action',
      iconBg: '#FFF7ED',
      iconColor: '#F97316',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
    },
    {
      label: 'Closed / Resolved',
      value: stats.summary.closed,
      sub: 'Safely resolved cases',
      iconBg: '#F0FDF4',
      iconColor: '#22C55E',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <div className="space-y-7 pb-4">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #192651 55%, #1B367A 100%)`,
          boxShadow: '0 6px 28px rgba(30,43,94,0.22)',
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/90"
              style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
            >
              Executive Clinical Overview
            </span>
            <span className="text-white/40 text-sm">&bull;</span>
            <span className="text-sm font-semibold text-white/70">Real-Time Sync</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-base mt-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Welcome back, <span className="font-bold text-white">{user?.name}</span>. Here is the active safety status for your department.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-5 py-3 text-sm font-bold rounded-xl text-white transition-all shadow-md cursor-pointer"
            style={{ backgroundColor: ROYAL }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1B367A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ROYAL; }}
          >
            Review All Incidents &rarr;
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-6 flex justify-between items-start transition-all hover:shadow-md"
            style={{
              backgroundColor: SURFACE,
              border: `1.5px solid ${BORDER}`,
              boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
            }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: TEXT_MUT }}
              >
                {card.label}
              </p>
              <h3 className="text-3xl font-extrabold" style={{ color: card.iconColor }}>
                {card.value}
              </h3>
              <p className="text-sm font-medium mt-2" style={{ color: TEXT_MUT }}>
                {card.sub}
              </p>
            </div>
            <div
              className="p-3 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: card.iconBg }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke={card.iconColor}
                viewBox="0 0 24 24"
              >
                {card.icon}
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Section ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Status Breakdown (Donut Chart) */}
        <div
          className="rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backgroundColor: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: TEXT_PRI }}>
                Incident Lifecycle Breakdown
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Department Total: {stats.summary.total}
              </span>
            </div>
            <p className="text-xs -mt-2 mb-4" style={{ color: TEXT_MUT }}>
              Distribution of incidents across workflow stages
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.charts.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.charts.byStatus.map((entry: { name: string; value: number }) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || TRUE_BLUE} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: SURFACE,
                    borderColor: BORDER,
                    color: TEXT_PRI,
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: TEXT_PRI }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3.5 mt-4 pt-3 border-t border-slate-200/80">
            {stats.charts.byStatus.map((entry: { name: string; value: number }) => (
              <div key={entry.name} className="flex items-center gap-2 bg-slate-100/60 px-3 py-1.5 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[entry.name] || TRUE_BLUE }}
                />
                <span className="text-xs font-semibold" style={{ color: TEXT_PRI }}>
                  {entry.name.replaceAll('_', ' ')}: <strong className="text-slate-900">{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents by Severity (Bar Chart) */}
        <div
          className="rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backgroundColor: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: TEXT_PRI }}>
                Severity Risk Profile
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                Critical Priority: {stats.summary.critical}
              </span>
            </div>
            <p className="text-xs -mt-2 mb-4" style={{ color: TEXT_MUT }}>
              Categorization by patient and operational impact severity
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.charts.bySeverity}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  stroke={TEXT_MUT}
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: BORDER }}
                />
                <YAxis
                  stroke={TEXT_MUT}
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: SURFACE,
                    borderColor: BORDER,
                    color: TEXT_PRI,
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  cursor={{ fill: '#EBF0FA', opacity: 0.8 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.charts.bySeverity.map((entry: { name: string; value: number }) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || TRUE_BLUE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3.5 mt-4 pt-3 border-t border-slate-200/80">
            {stats.charts.bySeverity.map((entry: { name: string; value: number }) => (
              <div key={entry.name} className="flex items-center gap-2 bg-slate-100/60 px-3 py-1.5 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[entry.name] || TRUE_BLUE }}
                />
                <span className="text-xs font-semibold" style={{ color: TEXT_PRI }}>
                  {entry.name}: <strong className="text-slate-900">{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action Shortcuts & Department Safety Overview ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => navigate('/incidents')}
          className="rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-0.5 group text-left w-full"
          style={{
            backgroundColor: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EBF0FA' }}>
              <svg className="w-6 h-6" fill="none" stroke={ROYAL} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold transition-colors group-hover:text-blue-700" style={{ color: TEXT_PRI }}>
                Triage Incident Queue
              </h4>
              <p className="text-sm mt-0.5" style={{ color: TEXT_MUT }}>
                Accept, investigate, or close reports
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/team')}
          className="rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-0.5 group text-left w-full"
          style={{
            backgroundColor: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
              <svg className="w-6 h-6" fill="none" stroke="#16A34A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold transition-colors group-hover:text-green-700" style={{ color: TEXT_PRI }}>
                Department Team Roles
              </h4>
              <p className="text-sm mt-0.5" style={{ color: TEXT_MUT }}>
                Assign investigators &amp; action owners
              </p>
            </div>
          </div>
        </button>

        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: SURFACE,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 2px 8px rgba(30,43,94,0.06)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF7ED' }}>
              <svg className="w-6 h-6" fill="none" stroke="#EA580C" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold" style={{ color: TEXT_PRI }}>
                Safety Protocol Status
              </h4>
              <p className="text-sm mt-0.5" style={{ color: TEXT_MUT }}>
                Compliance Active &bull; ISO-9001
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
