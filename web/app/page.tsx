'use client';
import { useState, useEffect, useRef } from 'react';
import { getSocket, refreshSocket } from '../lib/socket';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCachedUser, fetchCurrentUser, clearToken, friendlyError } from '../lib/auth';
import type { Socket } from 'socket.io-client';

type ProgressEvent = { 
  stage: string; 
  message: string; 
  percent: number 
};

const STAGE_LABELS: Record<string, string> = {
  start: 'Starting',
  scraping: 'Scanning GitHub',
  embedding: 'Indexing Repos',
  scoring: 'Scoring Profile',
  report: 'Writing Report',
  complete: 'Complete',
};

const CIRCUMFERENCE = 2 * Math.PI * 52;

function CircularProgress({ percent, stage, message }: { percent: number; stage: string; message: string }) {
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const stageLabel = STAGE_LABELS[stage] ?? stage;
  return (
    <div className="gi-progress-wrap">
      <div className="gi-ring-wrap">
        <svg className="gi-ring-svg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke="url(#pg)" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <defs>
            <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="gi-ring-inner">
          <span className="gi-ring-pct">{percent}%</span>
          <span className="gi-ring-stage">{stageLabel}</span>
        </div>
      </div>
      <p className="gi-progress-msg">{message}</p>
    </div>
  );
}

const ROLES = [
  'Full Stack Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'ML Engineer',
  'DevOps Engineer',
];

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ userId: string; email: string } | null>(() => getCachedUser());
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => setUser(u));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('analysis_progress', (data: ProgressEvent) => setProgress(data));

    socket.on('analysis_complete', (data: any) => {
      setLoading(false);
      router.push(`/report/${data.report_id}`);
    });

    socket.on('analysis_error', (data: { error: string }) => {
      setError(friendlyError(data.error));
      setLoading(false);
      setProgress(null);
    });

    return () => {
      socket.off('analysis_progress');
      socket.off('analysis_complete');
      socket.off('analysis_error');
    };
  }, [router]);

  const handleAnalyze = () => {
    if (!username.trim() || !socketRef.current) return;
    setError('');
    setLoading(true);
    setProgress({ stage: 'start', message: 'Connecting to analysis engine…', percent: 5 });
    socketRef.current.emit('start_analysis', { username: username.trim(), target_role: targetRole });
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    socketRef.current = refreshSocket();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        /* Layout */
        .gi-root {
          min-height: 100vh;
          background: #080b14;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient glows */
        .gi-glow-top {
          position: fixed; top: -120px; left: 50%;
          transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse at 50% 10%, rgba(99,102,241,0.14) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .gi-glow-bot {
          position: fixed; bottom: -200px; right: -100px;
          width: 600px; height: 500px;
          background: radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        /* Nav */
        .gi-nav {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 32px; height: 64px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 100;
          background: rgba(8,11,20,0.85);
          backdrop-filter: blur(16px);
        }
        .gi-nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .gi-logo-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #818cf8 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(79,70,229,0.4);
        }
        .gi-nav-brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 16px; font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.02em;
        }
        .gi-nav-right {
          display: flex; align-items: center; gap: 6px;
        }
        .gi-nav-sep {
          width: 1px; height: 18px;
          background: rgba(255,255,255,0.08);
          margin: 0 6px;
        }
        .gi-nav-email {
          font-size: 13px; color: rgba(148,163,184,0.5);
          max-width: 200px; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .gi-nav-link {
          font-size: 13px; font-weight: 500;
          color: rgba(148,163,184,0.75);
          text-decoration: none;
          padding: 6px 10px; border-radius: 7px;
          transition: all 0.15s;
        }
        .gi-nav-link:hover { color: white; background: rgba(255,255,255,0.06); }
        .gi-nav-btn-ghost {
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 500;
          color: rgba(148,163,184,0.55);
          padding: 6px 10px; border-radius: 7px;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .gi-nav-btn-ghost:hover { color: #f87171; background: rgba(239,68,68,0.07); }
        .gi-nav-register {
          font-family: 'Manrope', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #c7d2fe;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          padding: 7px 16px; border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .gi-nav-register:hover {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.4);
          color: white;
        }

        /* Hero */
        .gi-hero {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex: 1; 
          padding: 20px 20px 80px;
          position: relative; z-index: 1;
        }
        .gi-hero-inner { max-width: 500px; width: 100%; }

        /* Badge */
        .gi-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 100px; padding: 6px 16px;
          font-family: 'Manrope', sans-serif;
          font-size: 11px; font-weight: 700;
          color: rgba(165,180,252,0.9);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .gi-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #818cf8;
          box-shadow: 0 0 8px rgba(129,140,248,0.8);
          animation: gi-pulse 2s ease-in-out infinite;
        }
        @keyframes gi-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        /* Heading */
        .gi-heading {
          font-family: 'Manrope', sans-serif;
          font-size: clamp(40px, 7vw, 56px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.04em;
          color: rgba(255,255,255,0.96);
          margin-bottom: 18px;
          text-align: center;
        }
        .gi-heading-accent {
          background: linear-gradient(135deg, #818cf8 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gi-subheading {
          font-size: 16px;
          color: rgba(148,163,184,0.65);
          line-height: 1.65;
          font-weight: 400;
          text-align: center;
          margin-bottom: 20px;
          max-width: 380px;
          margin-left: auto; margin-right: auto;
        }

        /* Card */
        .gi-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02) inset,
            0 24px 48px rgba(0,0,0,0.4);
        }

        /* Form elements */
        .gi-field { display: flex; flex-direction: column; gap: 8px; }
        .gi-label {
          display: block;
          font-family: 'Manrope', sans-serif;
          font-size: 11px; font-weight: 700;
          color: rgba(148,163,184,0.55);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .gi-input-wrap { position: relative; }
        .gi-at {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: rgba(99,102,241,0.7);
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px; pointer-events: none; z-index: 1;
        }
        .gi-input {
          width: 100%;
          background: rgba(8,12,28,0.8);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 11px;
          padding: 13px 15px;
          color: white;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .gi-input-with-at { padding-left: 32px; }
        .gi-input:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .gi-input::placeholder { color: rgba(148,163,184,0.3); font-family: 'DM Sans', sans-serif; }

        .gi-select-wrap { position: relative; }
        .gi-select {
          width: 100%;
          background: rgba(8,12,28,0.8);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 11px;
          padding: 13px 15px;
          color: rgba(255,255,255,0.85);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          cursor: pointer; outline: none; appearance: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gi-select:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .gi-select-arrow {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(148,163,184,0.4);
        }

        /* Error */
        .gi-error {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 11px; padding: 13px 15px;
        }
        .gi-error-text { font-size: 13.5px; color: #fca5a5; line-height: 1.55; }

        /* Button */
        .gi-btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #4338ca, #6366f1 60%, #818cf8);
          color: white;
          font-family: 'Manrope', sans-serif;
          font-weight: 700; font-size: 14px;
          letter-spacing: 0.02em;
          padding: 14px 24px;
          border-radius: 11px; border: none;
          cursor: pointer;
          transition: all 0.25s;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(99,102,241,0.25);
        }
        .gi-btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .gi-btn-primary:hover:not(:disabled)::after { opacity: 1; }
        .gi-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.4);
        }
        .gi-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .gi-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Form gap */
        .gi-form { display: flex; flex-direction: column; gap: 20px; }

        /* Footer links */
        .gi-footer-links {
          display: flex; justify-content: center;
          gap: 28px; margin-top: 24px;
        }
        .gi-footer-link {
          font-size: 13px; color: rgba(148,163,184,0.4);
          text-decoration: none; transition: color 0.15s;
        }
        .gi-footer-link:hover { color: rgba(148,163,184,0.75); }

        /* Progress */
        .gi-progress-wrap {
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
          padding: 20px 0;
        }
        .gi-ring-wrap { position: relative; width: 148px; height: 148px; }
        .gi-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .gi-ring-inner {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 3px;
        }
        .gi-ring-pct {
          font-family: 'Manrope', sans-serif;
          font-size: 32px; font-weight: 800;
          color: white; line-height: 1;
          letter-spacing: -0.03em;
        }
        .gi-ring-stage {
          font-family: 'Manrope', sans-serif;
          font-size: 10px; font-weight: 700;
          color: #818cf8; text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .gi-progress-msg {
          font-size: 13.5px; color: rgba(148,163,184,0.55);
          text-align: center; max-width: 260px;
          line-height: 1.6;
        }

        /* Animations */
        @keyframes gi-fadein {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gi-a0 { animation: gi-fadein 0.55s ease forwards; }
        .gi-a1 { animation: gi-fadein 0.55s ease 0.1s both; }
        .gi-a2 { animation: gi-fadein 0.55s ease 0.2s both; }
        .gi-a3 { animation: gi-fadein 0.55s ease 0.3s both; }
      `}</style>

      <main className="gi-root">
        <div className="gi-glow-top" />
        <div className="gi-glow-bot" />

        {/* Nav */}
        <nav className="gi-nav">
          <Link href="/" className="gi-nav-brand">
            <div className="gi-logo-icon">⬡</div>
            <span className="gi-nav-brand-name">GitIntel</span>
          </Link>

          <div className="gi-nav-right">
            {user ? (
              <>
                <Link href="/dashboard" className="gi-nav-link">Dashboard</Link>
                <div className="gi-nav-sep" />
                <span className="gi-nav-email">{user.email}</span>
                <button className="gi-nav-btn-ghost" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="gi-nav-link">Sign in</Link>
                <Link href="/register" className="gi-nav-register">Register</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="gi-hero">
          <div className="gi-hero-inner">

            <div className="gi-a0" style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <span className="gi-badge">
                <span className="gi-badge-dot" />
                AI-powered recruiter signal
              </span>
            </div>

            <div className="gi-a1">
              <h1 className="gi-heading">
                What recruiters{' '}
                <span className="gi-heading-accent">actually see</span>
              </h1>
              <p className="gi-subheading">
                Analyze any GitHub profile instantly.
              </p>
            </div>

            <div className="gi-card gi-a2">
              {loading && progress ? (
                <CircularProgress percent={progress.percent} stage={progress.stage} message={progress.message} />
              ) : (
                <div className="gi-form">
                  <div className="gi-field">
                    <label className="gi-label">GitHub Username</label>
                    <div className="gi-input-wrap">
                      <span className="gi-at">@</span>
                      <input
                        className="gi-input gi-input-with-at"
                        placeholder="torvalds"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="gi-field">
                    <label className="gi-label">Target Role</label>
                    <div className="gi-select-wrap">
                      <select
                        className="gi-select"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      >
                        {ROLES.map((r) => <option key={r} style={{ background: '#0d1120' }}>{r}</option>)}
                      </select>
                      <svg className="gi-select-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {error && (
                    <div className="gi-error">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }}>
                        <path d="M7.5 1L1 13h13L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M7.5 6v3M7.5 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <p className="gi-error-text">{error}</p>
                    </div>
                  )}

                  <button className="gi-btn-primary" onClick={handleAnalyze} disabled={!username.trim()}>
                    Analyse Profile →
                  </button>
                </div>
              )}
            </div>

            <div className="gi-footer-links gi-a3">
              <Link href="/dashboard" className="gi-footer-link">Past analyses</Link>
              {!user && <Link href="/login" className="gi-footer-link">Sign in to save</Link>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}