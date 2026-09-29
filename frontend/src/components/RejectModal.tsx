import React, { useState } from 'react';

// ── Color Tokens ─────────────────────────────────────────────────────
const SURFACE = '#F7F8FA';
const BG_PAGE = '#EDEEF3';
const TEXT    = '#1A2447';
const MUTED   = '#6B7494';
const BORDER  = '#D8DCE8';
const DANGER  = '#EF4444';
const ROYAL   = '#2952C4';


interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim().length < 10) { setError('Reason must be at least 10 characters long.'); return; }
    if (reason.length > 500)       { setError('Reason cannot exceed 500 characters.'); return; }
    setError('');
    onConfirm(reason.trim());
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
          <h3 className="text-base font-bold" style={{ color: TEXT }}>Reject Incident</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            Please provide a reason for rejecting this incident. This will be recorded in the system.
          </p>

          <textarea
            className="w-full rounded-xl p-3 text-sm outline-none resize-none transition-all"
            style={{
              backgroundColor: BG_PAGE,
              border: `1.5px solid ${error ? DANGER : BORDER}`,
              color: TEXT,
            }}
            rows={4}
            placeholder="Enter rejection reason (min 10 characters)..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
            disabled={isLoading}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = error ? DANGER : ROYAL; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px #EBF0FA'; }}
            onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = error ? DANGER : BORDER; (e.target as HTMLElement).style.boxShadow = 'none'; }}
          />

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
            style={{ backgroundColor: DANGER, border: `1px solid ${DANGER}` }}
          >
            {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};