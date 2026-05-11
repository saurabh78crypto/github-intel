'use client';
import { useEffect, useState } from 'react';
import { historyApi } from '../../lib/api';
import { fetchCurrentUser } from '../../lib/auth';
import Link from 'next/link';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70
    ? { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)', text: '#34d399', dot: '#10b981' }
    : score >= 40
    ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', text: '#fbbf24', dot: '#f59e0b' }
    : { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)', text: '#f87171', dot: '#ef4444' };

  return (
    <div style={{
      background: color.bg, border: `1px solid ${color.border}`,
      borderRadius: '10px', padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0,
    }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: color.dot,
        boxShadow: `0 0 8px ${color.dot}`,
      }} />
      <span style={{
        fontSize: '16px', fontWeight: 800, color: color.text,
        fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em',
      }}>{score}</span>
    </div>
  );
}

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }
  .font-display { font-family: 'Manrope', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function DashboardPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (!user) { setLoading(false); return; }
      setLoggedIn(true);
      historyApi.getMyHistory()
        .then((res) => setHistory(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) return (
    <>
      <style>{SHARED_STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '2.5px solid rgba(99,102,241,0.12)',
            borderTop: '2.5px solid #6366f1',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '14px', color: 'rgba(148,163,184,0.45)', fontFamily: 'DM Sans, sans-serif' }}>
            Loading your analyses…
          </span>
        </div>
      </div>
    </>
  );

  if (!loggedIn) return (
    <>
      <style>{SHARED_STYLES}</style>
      <main style={{
        minHeight: '100vh', background: '#080b14', color: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', textAlign: 'center', position: 'relative',
      }}>
        <div style={{
          position: 'fixed', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 10%, rgba(99,102,241,0.1) 0%, transparent 65%)',
        }} />
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', marginBottom: '24px',
        }}>🔒</div>
        <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Sign in to view history
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(148,163,184,0.5)', maxWidth: '300px', lineHeight: 1.65, marginBottom: '28px' }}>
          Create a free account to save every analysis and track your progress.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)', padding: '11px 24px',
            borderRadius: '11px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', fontFamily: 'Manrope, sans-serif',
          }}>Sign in</Link>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #4338ca, #6366f1)',
            color: 'white', padding: '11px 24px',
            borderRadius: '11px', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', fontFamily: 'Manrope, sans-serif',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>Create account</Link>
        </div>
        <Link href="/" style={{
          marginTop: '24px', fontSize: '13.5px',
          color: 'rgba(148,163,184,0.35)', textDecoration: 'none',
        }}>← Continue without an account</Link>
      </main>
    </>
  );

  return (
    <>
      <style>{`
        ${SHARED_STYLES}
        .dash-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 18px 22px;
          text-decoration: none; display: block;
          transition: all 0.2s;
          animation: fadein 0.4s ease forwards;
        }
        .dash-card:hover {
          border-color: rgba(99,102,241,0.35);
          background: rgba(99,102,241,0.05);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .dash-new-btn {
          background: linear-gradient(135deg, #4338ca, #6366f1);
          color: white; padding: 10px 20px;
          border-radius: 10px; font-size: 14px; font-weight: 700;
          text-decoration: none; font-family: 'Manrope', sans-serif;
          white-space: nowrap; align-self: flex-start;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
          transition: all 0.2s;
        }
        .dash-new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#080b14', color: 'white', padding: '48px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>⬡</div>
                <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>GitIntel</span>
              </Link>
              <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
                Your analyses
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.4)' }}>
                {history.length} report{history.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <Link href="/" className="dash-new-btn">+ New analysis</Link>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

          {history.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '64px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '14px', opacity: 0.45 }}>📂</div>
              <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '15px', marginBottom: '16px' }}>No analyses yet</p>
              <Link href="/" style={{ color: '#a5b4fc', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
                Analyse your first profile →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((item: any, idx: number) => (
                <Link key={item.id} href={`/report/${item.id}`} className="dash-card"
                  style={{ animationDelay: `${idx * 0.05}s`, opacity: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ marginBottom: '7px' }}>
                        <span className="font-mono" style={{
                          fontSize: '15px', fontWeight: 500,
                          color: 'rgba(255,255,255,0.88)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'block',
                        }}>@{item.username}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '12px', color: 'rgba(165,180,252,0.7)',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.18)',
                          borderRadius: '5px', padding: '3px 9px',
                          fontFamily: 'Manrope, sans-serif', fontWeight: 600,
                        }}>{item.targetRole}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.35)' }}>
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <ScoreBadge score={item.overallScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}