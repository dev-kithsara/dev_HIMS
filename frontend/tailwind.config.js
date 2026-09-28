/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── KAIROS Blue Family Core ──────────────────────────────────
        'k-navy':           '#111184',   // Primary brand
        'k-navy-dark':      '#0C0C6B',   // Pressed / active
        'k-navy-light':     '#1a1aa0',   // Hover
        'k-cobalt':         '#1E40AF',   // Cobalt blue
        'k-royal':          '#2563EB',   // Royal blue
        'k-true-blue':      '#3B82F6',   // True blue
        'k-sky':            '#60A5FA',   // Sky blue
        'k-blue-gray':      '#64748B',   // Blue-gray muted
        'k-blue-gray-lt':   '#94A3B8',   // Lighter blue-gray
        // ── Content Area ────────────────────────────────────────────
        'k-bg':             '#F0F4FF',   // Page background
        'k-surface':        '#FFFFFF',   // Cards
        'k-surface-alt':    '#F8FAFF',   // Alt surface
        'k-border':         '#DBEAFE',   // Soft blue border
        'k-border-dark':    '#BFDBFE',   // Darker border
        // ── Text ────────────────────────────────────────────────────
        'k-text-primary':   '#0F1B4C',   // Heading color
        'k-text-body':      '#334155',   // Body text
        'k-text-muted':     '#64748B',   // Muted text
        'k-text-faint':     '#94A3B8',   // Faint / placeholder
        // ── Severity ────────────────────────────────────────────────
        'sev-low':            '#22C55E',
        'sev-medium':         '#EAB308',
        'sev-high':           '#F97316',
        'sev-critical':       '#EF4444',
        // ── Status ──────────────────────────────────────────────────
        'status-open':        '#3B82F6',
        'status-accepted':    '#10B981',
        'status-rejected':    '#EF4444',
        'status-investing':   '#8B5CF6',
        'status-pending':     '#F59E0B',
        'status-progress':    '#EC4899',
        'status-review':      '#0EA5E9',
        'status-closed':      '#22C55E',
      },
    },
  },
  plugins: [],
}