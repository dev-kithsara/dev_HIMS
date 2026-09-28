import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getDepartmentName } from '../utils/constants';

export const Header: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) return null;

  return (
    <header
      className="h-16 flex items-center justify-end px-8 shrink-0"
      style={{
        backgroundColor: 'var(--k-header-bg)',
        borderBottom: '1px solid var(--k-header-border)',
      }}
    >
      {/* Right Side: Profile Info */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex flex-col items-end">
          <span className="text-[15px] font-bold text-white leading-tight">
            {getDepartmentName(user.departmentId)} &bull; {user.name}
          </span>
          <span
            className="text-[11px] font-bold tracking-[0.16em] uppercase mt-1 px-2.5 py-0.5 rounded-md"
            style={{
              color: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            {user.role?.replace('_', ' ')}
          </span>
        </div>

        {/* Avatar Circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-inner"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.35)' }}
        >
          {user.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
};
