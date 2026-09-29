import React, { useState } from 'react';

// ── Color Tokens ─────────────────────────────────────────────────────
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const BORDER  = '#D8DCE8';
const DANGER  = '#EF4444';
const ROYAL   = '#2952C4';
const NAVY    = '#1E2B5E';

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number) => void;
  isLoading: boolean;
  title: string;
  description: string;
  availableUsers: { id: number; name: string; role?: string }[];
}

export const AssignUserModal: React.FC<AssignUserModalProps> = ({
  isOpen, onClose, onConfirm, isLoading, title, description, availableUsers,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedUserId === '') { setError('Please select a user from the list.'); return; }
    setError('');
    onConfirm(Number(selectedUserId));
  };

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50"
      style={{ backgroundColor: 'rgba(15,27,76,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, boxShadow: '0 24px 60px rgba(17,17,132,0.18)' }}
      >
        {/* Header */}
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h3 className="text-base font-bold" style={{ color: TEXT }}>{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm mb-4" style={{ color: MUTED }}>{description}</p>

          <select
            className="w-full rounded-xl p-3 text-sm outline-none transition-all cursor-pointer"
            style={{
              backgroundColor: BG_PAGE,
              border: `1.5px solid ${error ? DANGER : BORDER}`,
              color: TEXT,
            }}
            value={selectedUserId}
            onChange={(e) => { setSelectedUserId(Number(e.target.value)); if (error) setError(''); }}
            disabled={isLoading}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = error ? DANGER : ROYAL; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px #EBF0FA'; }}
            onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = error ? DANGER : BORDER; (e.target as HTMLElement).style.boxShadow = 'none'; }}
          >
            <option value="" disabled style={{ backgroundColor: SURFACE }}>-- Select a User --</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id} style={{ backgroundColor: SURFACE }}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>

          {error && <p className="text-xs mt-1.5 font-medium" style={{ color: DANGER }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            style={{ color: MUTED, border: `1px solid ${BORDER}`, backgroundColor: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-white"
            style={{ backgroundColor: NAVY, border: `1px solid ${NAVY}` }}
          >
            {isLoading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};