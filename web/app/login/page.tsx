'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../lib/api';
import { fetchCurrentUser, friendlyError } from '../../lib/auth';
import { refreshSocket } from '../../lib/socket';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await authApi.login(email, password);
      refreshSocket();
      await fetchCurrentUser();
      router.push('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? '';
      setError(
        msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized')
          ? 'Incorrect email or password. Please try again.'
          : friendlyError(msg),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        .auth-root {
          min-height: 100vh;
          background: #080b14;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 20px;
          position: relative; overflow: hidden;
        }
        .auth-glow {
          position: fixed; top: -100px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 500px;
          background: radial-gradient(ellipse at 50% 10%, rgba(99,102,241,0.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .auth-wrap {
          max-width: 420px; width: 100%;
          position: relative; z-index: 1;
          animation: auth-in 0.5s ease forwards;
        }
        @keyframes auth-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Brand */
        .auth-brand {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          margin-bottom: 40px;
        }
        .auth-brand-link {
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none; margin-bottom: 28px;
        }
        .auth-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #818cf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 6px 20px rgba(79,70,229,0.4);
        }
        .auth-brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 18px; font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.02em;
        }
        .auth-title {
          font-family: 'Manrope', sans-serif;
          font-size: 30px; font-weight: 800;
          color: white; letter-spacing: -0.03em;
          margin-bottom: 10px;
        }
        .auth-subtitle {
          font-size: 15px; color: rgba(148,163,184,0.55);
          line-height: 1.6;
        }

        /* Card */
        .auth-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 32px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02) inset,
            0 24px 48px rgba(0,0,0,0.4);
          display: flex; flex-direction: column; gap: 20px;
        }

        /* Fields */
        .auth-field { display: flex; flex-direction: column; gap: 8px; }
        .auth-label {
          font-family: 'Manrope', sans-serif;
          font-size: 11px; font-weight: 700;
          color: rgba(148,163,184,0.55);
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .auth-input {
          width: 100%;
          background: rgba(8,12,28,0.8);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 11px;
          padding: 13px 16px;
          color: white; font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          display: block;
        }
        .auth-input:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .auth-input::placeholder { color: rgba(148,163,184,0.3); }

        /* Error */
        .auth-error {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 11px; padding: 13px 15px;
        }
        .auth-error-text { font-size: 13.5px; color: #fca5a5; line-height: 1.55; }

        /* Button */
        .auth-btn {
          width: 100%;
          background: linear-gradient(135deg, #4338ca, #6366f1 60%, #818cf8);
          color: white;
          font-family: 'Manrope', sans-serif;
          font-weight: 700; font-size: 15px;
          letter-spacing: 0.02em;
          padding: 14px 24px;
          border-radius: 11px; border: none;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          margin-top: 4px;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.4);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Footer */
        .auth-footer {
          text-align: center; margin-top: 24px;
          font-size: 14px; color: rgba(148,163,184,0.45);
        }
        .auth-footer-link {
          color: #a5b4fc; text-decoration: none; font-weight: 500;
          transition: color 0.15s;
        }
        .auth-footer-link:hover { color: #c7d2fe; }
      `}</style>

      <main className="auth-root">
        <div className="auth-glow" />

        <div className="auth-wrap">
          <div className="auth-brand">
            <Link href="/" className="auth-brand-link">
              <div className="auth-logo">⬡</div>
              <span className="auth-brand-name">GitIntel</span>
            </Link>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to access your saved analyses</p>
          </div>

          <div className="auth-card">
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                type="email" className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password" className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div className="auth-error">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }}>
                  <path d="M7.5 1L1 13h13L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7.5 6v3M7.5 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="auth-error-text">{error}</p>
              </div>
            )}

            <button className="auth-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>

          <p className="auth-footer">
            No account?{' '}
            <Link href="/register" className="auth-footer-link">Create one →</Link>
          </p>
        </div>
      </main>
    </>
  );
}