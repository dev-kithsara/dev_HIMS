// frontend/src/pages/TeamManagement.tsx

import React, { useState, useMemo } from 'react';
import { useDepartmentUsers, useChangeUserRole } from '../hooks/useUsers';
import { useAuthContext } from '../context/AuthContext';
import type { User } from '../types/incident';

// ── Color Tokens ──────────────────────────────────────────────────────────
const NAVY    = '#1E2B5E';
const ROYAL   = '#2952C4';
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const BORDER  = '#D8DCE8';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const FAINT   = '#9BA4BC';

export const TeamManagement: React.FC = () => {
  const { user: currentUser } = useAuthContext();
  const { data: rawUsers, isLoading, isError } = useDepartmentUsers();
  const changeRoleMutation = useChangeUserRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'INVESTIGATOR' | 'ACTION_OWNER' | 'STAFF'>('ALL');
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number; name: string; role: string } | null>(null);

  // Filter out ADMIN users (Managers manage only their department personnel)
  const users = useMemo(() => {
    return (rawUsers || []).filter((u: User) => u.role !== 'ADMIN');
  }, [rawUsers]);

  // Groupings & Counts
  const investigators = useMemo(() => users.filter((u: User) => u.role === 'INVESTIGATOR'), [users]);
  const actionOwners  = useMemo(() => users.filter((u: User) => u.role === 'ACTION_OWNER'), [users]);
  const generalStaff  = useMemo(() => users.filter((u: User) => u.role === 'STAFF'), [users]);

  // Filtered by Search and Active Tab
  const displayedUsers = useMemo(() => {
    return users.filter((u: User) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'ALL') return true;
      return u.role === activeTab;
    });
  }, [users, searchTerm, activeTab]);

  const handleRoleChange = (userId: number, name: string, role: string) => setPendingRoleChange({ userId, name, role });
  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    changeRoleMutation.mutate(
      { userId: pendingRoleChange.userId, newRole: pendingRoleChange.role },
      { onSuccess: () => setPendingRoleChange(null) }
    );
  };

  const getAvatarColor = (role?: string) => {
    if (role === 'INVESTIGATOR') return '#7C3AED';
    if (role === 'ACTION_OWNER') return '#D97706';
    if (role === 'MANAGER') return NAVY;
    return '#475569';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'INVESTIGATOR':
        return (
          <span
            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            <span>Investigator</span>
          </span>
        );
      case 'ACTION_OWNER':
        return (
          <span
            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Action Owner</span>
          </span>
        );
      case 'MANAGER':
        return (
          <span
            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#EBF0FA', color: NAVY, border: '1px solid #C0CBE0' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
            <span>Manager</span>
          </span>
        );
      default:
        return (
          <span
            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Staff Member</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div
          className="animate-spin rounded-full h-12 w-12 border-[3px] border-t-transparent"
          style={{ borderColor: `${ROYAL} transparent ${ROYAL} ${ROYAL}` }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="p-6 rounded-2xl"
        style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
      >
        <p className="text-base font-bold text-red-600">Error loading department team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-6">
      {/* ── Page Header (Clean, Corporate & Professional) ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: TEXT }}>
            Department Team
          </h1>
          <p className="text-base mt-1" style={{ color: MUTED }}>
            Manage staff members, assigned Investigators, and Action Owners for your clinical unit.
          </p>
        </div>
      </div>

      {/* ── Overview Metrics Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border-2 text-left w-full ${
            activeTab === 'ALL' ? 'border-[#1E2B5E] shadow-sm' : 'border-transparent'
          }`}
          style={{ backgroundColor: SURFACE, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                Total Department Staff
              </p>
              <h3 className="text-3xl font-extrabold mt-2" style={{ color: TEXT }}>
                {users.length}
              </h3>
              <p className="text-xs font-semibold mt-1" style={{ color: ROYAL }}>
                All active personnel
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INVESTIGATOR')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border-2 text-left w-full ${
            activeTab === 'INVESTIGATOR' ? 'border-purple-600 shadow-sm' : 'border-transparent'
          }`}
          style={{ backgroundColor: SURFACE, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6D28D9' }}>
                Investigators
              </p>
              <h3 className="text-3xl font-extrabold mt-2 text-purple-950">
                {investigators.length}
              </h3>
              <p className="text-xs font-semibold mt-1 text-purple-700">
                Root cause analysis leads
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACTION_OWNER')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border-2 text-left w-full ${
            activeTab === 'ACTION_OWNER' ? 'border-amber-600 shadow-sm' : 'border-transparent'
          }`}
          style={{ backgroundColor: SURFACE, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#B45309' }}>
                Action Owners
              </p>
              <h3 className="text-3xl font-extrabold mt-2 text-amber-950">
                {actionOwners.length}
              </h3>
              <p className="text-xs font-semibold mt-1 text-amber-700">
                Corrective action leads
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STAFF')}
          className={`rounded-2xl p-5 cursor-pointer transition-all border-2 text-left w-full ${
            activeTab === 'STAFF' ? 'border-slate-600 shadow-sm' : 'border-transparent'
          }`}
          style={{ backgroundColor: SURFACE, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                General Staff
              </p>
              <h3 className="text-3xl font-extrabold mt-2" style={{ color: TEXT }}>
                {generalStaff.length}
              </h3>
              <p className="text-xs font-semibold mt-1" style={{ color: MUTED }}>
                Incident reporters
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* ── Filter Tabs & Search Bar ─────────────────────────────────────── */}
      <div
        className="p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
      >
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Members', count: users.length },
            { id: 'INVESTIGATOR', label: 'Investigators', count: investigators.length },
            { id: 'ACTION_OWNER', label: 'Action Owners', count: actionOwners.length },
            { id: 'STAFF', label: 'General Staff', count: generalStaff.length },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1E2B5E] text-white shadow-xs'
                  : 'bg-[#EDEEF3] text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label} <span className="opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-[15px] rounded-xl outline-none transition-all"
            style={{
              backgroundColor: '#F1F3F8',
              border: `1.5px solid ${BORDER}`,
              color: TEXT,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = ROYAL; e.currentTarget.style.boxShadow = '0 0 0 3px #EBF0FA'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ── Clean Data Table ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden shadow-xs"
        style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(30,43,94,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: BG_PAGE, borderBottom: `1.5px solid ${BORDER}`, color: MUTED }}
              >
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Official Email</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4 text-right">Role Delegation</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-base font-medium" style={{ color: FAINT }}>
                    No department staff members found in this view.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user, i) => {
                  const isSelf = user.id === currentUser?.id;
                  const isManager = user.role === 'MANAGER';
                  const canEdit = !isSelf && !isManager;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{
                        backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F1F3F8',
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EBF0FA'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? '#FFFFFF' : '#F1F3F8'; }}
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-xs"
                            style={{
                              backgroundColor: getAvatarColor(user.role),
                            }}
                          >
                            {user.name?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <div className="text-[15px] font-bold" style={{ color: TEXT }}>
                              {user.name}
                            </div>
                            {isSelf && (
                              <span className="text-xs font-bold text-blue-700">
                                (You &bull; Department Lead)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4.5 text-[14px] font-medium" style={{ color: MUTED }}>
                        {user.email}
                      </td>

                      <td className="px-6 py-4.5">
                        {getRoleBadge(user.role || 'STAFF')}
                      </td>

                      <td className="px-6 py-4.5 text-right">
                        {canEdit ? (
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={user.role || 'STAFF'}
                              onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)}
                              disabled={changeRoleMutation.isPending}
                              className="px-3.5 py-2 rounded-xl text-sm font-semibold outline-none cursor-pointer disabled:opacity-50 transition-all"
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: `1.5px solid ${BORDER}`,
                                color: TEXT,
                              }}
                            >
                              <option value="STAFF">Staff</option>
                              <option value="INVESTIGATOR">Investigator</option>
                              <option value="ACTION_OWNER">Action Owner</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 italic">
                            Department Manager
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pendingRoleChange && (
        <section className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[var(--k-border)] bg-white p-5 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="role-change-title">
          <h2 id="role-change-title" className="font-bold" style={{ color: TEXT }}>Confirm role change</h2>
          <p className="mt-2 text-sm leading-5" style={{ color: MUTED }}>Change <strong>{pendingRoleChange.name}</strong> to <strong>{pendingRoleChange.role.replace('_', ' ')}</strong>?</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingRoleChange(null)} className="rounded-lg border px-3.5 py-2 text-sm font-semibold" style={{ borderColor: BORDER, color: TEXT }}>Cancel</button>
            <button type="button" onClick={confirmRoleChange} disabled={changeRoleMutation.isPending} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: NAVY }}>Confirm change</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamManagement;
