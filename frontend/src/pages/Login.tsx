// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { useAuthContext } from '../context/AuthContext';
import logoImage from '../assets/logo.jpeg';

// ── KAIROS Blue Palette ───────────────────────────────────────────────────
const NAVY      = '#1E2B5E';
const COBALT    = '#1B367A';
const ROYAL     = '#2952C4';
const BG        = '#EDEEF3';
const SURFACE   = '#F7F8FA';
const TEXT      = '#1A2447';
const MUTED     = '#6B7494';
const BORDER    = '#D8DCE8';
const DANGER    = '#EF4444';

export const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [emailFocus, setEmailFocus]       = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const navigate       = useNavigate();
  const loginMutation  = useLogin();
  const { login: contextLogin } = useAuthContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          contextLogin(data.user, data.token);
          if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
            navigate('/');
          } else if (data.user.role === 'INVESTIGATOR') {
            navigate('/investigator');
          } else if (data.user.role === 'STAFF') {
            navigate('/submit-incident');
          } else if (data.user.role === 'ACTION_OWNER') {
            navigate('/action-owner');
          } else {
            navigate('/login');
          }
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
          setErrorMsg(message);
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden"
      style={{ backgroundColor: BG }}
    >
      {/* Subtle background shapes */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none opacity-30"
        style={{ background: `radial-gradient(circle, ${NAVY}40 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${ROYAL}50 0%, transparent 70%)` }}
      />

      {/* ── Login Card ──────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-md rounded-2xl p-8 relative z-10"
        style={{
          backgroundColor: SURFACE,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 20px 60px rgba(17,17,132,0.12), 0 4px 20px rgba(17,17,132,0.08)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div
            className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-5 p-1.5"
            style={{
              background: `linear-gradient(135deg, ${NAVY} 0%, ${COBALT} 100%)`,
              boxShadow: `0 8px 24px ${NAVY}40`,
            }}
          >
            <img
              src={logoImage}
              alt="KAIROS Logo"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Title */}
          <h2
            className="text-2xl font-extrabold tracking-widest"
            style={{ color: NAVY }}
          >
            KAIROS HIMS
          </h2>
          <p className="text-sm mt-1.5" style={{ color: MUTED }}>
            Sign in to your account
          </p>
        </div>

        {/* ── Form ── */}
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Error Banner */}
          {errorMsg && (
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ backgroundColor: `${DANGER}10`, border: `1px solid ${DANGER}40` }}
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={DANGER}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm" style={{ color: DANGER }}>{errorMsg}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5" style={{ color: TEXT }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="Enter your email"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                backgroundColor: emailFocus ? '#FFFFFF' : '#F1F3F8',
                border: `1.5px solid ${emailFocus ? ROYAL : BORDER}`,
                color: TEXT,
                boxShadow: emailFocus ? `0 0 0 3px #EBF0FA` : 'none',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5" style={{ color: TEXT }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                backgroundColor: passwordFocus ? '#FFFFFF' : '#F1F3F8',
                border: `1.5px solid ${passwordFocus ? ROYAL : BORDER}`,
                color: TEXT,
                boxShadow: passwordFocus ? `0 0 0 3px #EBF0FA` : 'none',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: `linear-gradient(135deg, ${NAVY} 0%, ${COBALT} 100%)`,
              boxShadow: `0 4px 20px ${NAVY}40`,
            }}
            onMouseEnter={(e) => {
              if (!loginMutation.isPending)
                (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 28px ${NAVY}60`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${NAVY}40`;
            }}
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: MUTED }}>
            Hospital Incident &amp; Risk Management
          </p>
        </div>
      </div>
    </div>
  );
};
