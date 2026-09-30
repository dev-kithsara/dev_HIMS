import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden antialiased" style={{ backgroundColor: 'var(--k-bg)' }}>
      {/* Left Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Section */}
      <div className="app-main flex-1 min-w-0 flex flex-col min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--k-bg)' }}>
        {/* Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer
          className="py-3 px-4 sm:px-6 text-xs flex justify-between items-center gap-3"
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
          <span className="hidden sm:inline" style={{ color: 'var(--k-text-muted)' }}>Incident &amp; risk management</span>
        </footer>
      </div>
    </div>
  );
};
