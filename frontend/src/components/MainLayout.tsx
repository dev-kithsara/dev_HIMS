import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased" style={{ backgroundColor: 'var(--k-bg)' }}>
      {/* Left Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Section */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--k-bg)' }}>
        {/* Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer
          className="py-3 px-6 text-xs flex justify-between items-center"
          style={{
            borderTop: '1px solid var(--k-border)',
            backgroundColor: 'var(--k-surface)',
            color: 'var(--k-text-muted)',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()}{' '}
            <span className="font-semibold" style={{ color: 'var(--k-navy)' }}>KAIROS HIMS</span>. Hospital Incident &amp;
            Risk Management.
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--k-royal)' }}
            />
            <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--k-royal)' }}>
              SYSTEM ONLINE
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
