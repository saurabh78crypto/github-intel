'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { historyApi } from '../../../lib/api';

// Score bar
function ScoreBar({ label, value, reasoning }: { label: string; value: number; reasoning?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const bgColor = pct >= 70 ? 'rgba(16,185,129,0.1)' : pct >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>{label}</span>
        <span style={{
          fontSize: '12px', fontWeight: 800, color,
          background: bgColor, borderRadius: '6px', padding: '3px 9px',
          fontFamily: 'Manrope, sans-serif',
        }}>{pct}</span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '5px',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          width: mounted ? `${pct}%` : '0%',
          transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      {reasoning && (
        <p style={{ fontSize: '12.5px', color: 'rgba(148,163,184,0.4)', lineHeight: 1.55 }}>{reasoning}</p>
      )}
    </div>
  );
}

// Skill pill
function SkillPill({ label, variant }: { label: string; variant: 'matched' | 'gap' }) {
  const s = variant === 'matched'
    ? { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)', color: '#c7d2fe' }
    : { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.22)', color: '#fed7aa' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: '7px', padding: '5px 11px',
      fontSize: '12.5px', fontWeight: 500, color: s.color,
      letterSpacing: '0.01em',
    }}>{label}</span>
  );
}

// Score ring
function ScoreRing({ score }: { score: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 250); return () => clearTimeout(t); }, []);
  const r = 40; const circ = 2 * Math.PI * r;
  const offset = mounted ? circ * (1 - score / 100) : circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const glow = score >= 70 ? 'rgba(16,185,129,0.35)' : score >= 40 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
  return (
    <div style={{ position: 'relative', width: '104px', height: '104px', flexShrink: 0 }}>
      <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5.5" />
        <circle
          cx="52" cy="52" r={r} fill="none"
          stroke={color} strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${glow})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '2px',
      }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color: 'white', fontFamily: 'Manrope, sans-serif', lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</span>
        <span style={{ fontSize: '9.5px', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>score</span>
      </div>
    </div>
  );
}

// Section
function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '22px 24px',
      ...style,
    }}>{children}</div>
  );
}
function SLabel({ children, color = 'rgba(148,163,184,0.45)' }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 700, color,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      fontFamily: 'Manrope, sans-serif', marginBottom: '18px',
    }}>{children}</p>
  );
}

// Stat card
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px', padding: '18px 16px',
      textAlign: 'center', flex: 1,
    }}>
      <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.03em', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.4)', letterSpacing: '0.03em' }}>{label}</div>
    </div>
  );
}

// Scroll to top
function ScrollTopBtn() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: '28px', right: '28px', zIndex: 200,
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        color: '#a5b4fc', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        animation: 'rpt-in 0.25s ease forwards',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.28)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
      title="Scroll to top"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    historyApi.getReport(id as string)
      .then((res) => { setReport(res.data.report ?? res.data); setLoading(false); })
      .catch(() => { setError('Report not found.'); setLoading(false); });
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid rgba(99,102,241,0.12)', borderTop: '2.5px solid #6366f1', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '14px', color: 'rgba(148,163,184,0.45)' }}>Loading report…</span>
        </div>
      </div>
    </>
  );

  if (error || !report) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap'); * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }`}</style>
      <div style={{ minHeight: '100vh', background: '#080b14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        <p style={{ color: '#f87171', fontSize: '15px' }}>{error || 'Report not found.'}</p>
        <Link href="/" style={{ color: '#a5b4fc', fontSize: '14px', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </>
  );

  const {
    score, score_reasoning = {}, profile, summary, strengths = [], weaknesses = [],
    skill_gaps = [], matched_skills = [], repo_suggestions = [], top_repos = [],
    target_role, total_repos_analyzed,
  } = report;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .rpt-mono { font-family: 'JetBrains Mono', monospace; }
        .rpt-display { font-family: 'Manrope', sans-serif; }

        .rpt-btn-ghost {
          flex: 1; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.65); padding: 13px 20px;
          border-radius: 11px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Manrope', sans-serif;
          display: flex; align-items: center; justify-content: center;
        }
        .rpt-btn-ghost:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          color: white;
        }
        .rpt-btn-primary {
          flex: 1; background: linear-gradient(135deg, #4338ca, #6366f1);
          color: white; padding: 13px 20px;
          border-radius: 11px; font-size: 14px; font-weight: 700;
          text-decoration: none; font-family: 'Manrope', sans-serif;
          text-align: center; display: flex;
          align-items: center; justify-content: center;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .rpt-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        }
        .rpt-repo-chip {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 7px 13px;
          font-size: 12.5px; color: rgba(148,163,184,0.65);
          text-decoration: none; font-family: 'JetBrains Mono', monospace;
          transition: all 0.2s;
        }
        .rpt-repo-chip:hover {
          background: rgba(99,102,241,0.09);
          border-color: rgba(99,102,241,0.3);
          color: #c7d2fe;
        }
        .rpt-nav-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(148,163,184,0.4); text-decoration: none;
          font-size: 13.5px; transition: color 0.15s;
          padding: 5px 0;
        }
        .rpt-nav-back:hover { color: rgba(148,163,184,0.75); }
        .rpt-nav-dash {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(148,163,184,0.5); text-decoration: none;
          font-size: 13.5px; font-weight: 500;
          padding: 7px 14px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          transition: all 0.15s;
        }
        .rpt-nav-dash:hover {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }
        @keyframes rpt-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rpt-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rpt-fade { animation: rpt-fadein 0.45s ease forwards; }
        @media (max-width: 500px) { .rpt-two-col { grid-template-columns: 1fr !important; } }
      `}</style>

      <ScrollTopBtn />

      <main style={{ minHeight: '100vh', background: '#080b14', color: 'white', padding: '32px 16px 64px' }}>
        {/* Ambient */}
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '300px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.09) 0%, transparent 65%)',
          zIndex: 0,
        }} />

        <div className="rpt-fade" style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Top nav row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <Link href="/" className="rpt-nav-back">
              ← New analysis
            </Link>
            <Link href="/dashboard" className="rpt-nav-dash">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.6 }}>
                <rect x="1" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="8" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="8" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Dashboard
            </Link>
          </div>

          {/* Header card */}
          <Section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span className="rpt-mono" style={{ fontSize: '20px', fontWeight: 500, color: 'white' }}>
                    @{profile?.username}
                  </span>
                  {profile?.name && profile.name !== profile.username && (
                    <span style={{ fontSize: '14px', color: 'rgba(148,163,184,0.4)' }}>{profile.name}</span>
                  )}
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '12px', color: '#c7d2fe',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.22)',
                  borderRadius: '6px', padding: '3px 10px',
                  fontFamily: 'Manrope, sans-serif', fontWeight: 600, marginBottom: '10px',
                }}>{target_role}</span>
                {profile?.bio && (
                  <p style={{ fontSize: '13.5px', color: 'rgba(148,163,184,0.5)', lineHeight: 1.6, fontStyle: 'italic' }}>{profile.bio}</p>
                )}
              </div>
              <ScoreRing score={score?.overall ?? 0} />
            </div>
          </Section>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <StatCard label="Repos analysed" value={total_repos_analyzed ?? '—'} />
            <StatCard label="Followers" value={profile?.followers ?? '—'} />
            <StatCard label="Public repos" value={profile?.public_repos ?? '—'} />
          </div>

          {/* Summary */}
          <Section>
            <SLabel>AI Summary</SLabel>
            <p style={{ fontSize: '14.5px', color: 'rgba(203,213,225,0.72)', lineHeight: 1.8 }}>{summary}</p>
          </Section>

          {/* Scores */}
          <Section>
            <SLabel>Recruiter Signal Scores</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {(['activity', 'depth', 'breadth', 'communication', 'impact'] as const).map((key) => (
                <ScoreBar key={key} label={key} value={score?.[key] ?? 0} reasoning={score_reasoning[key]} />
              ))}
            </div>
          </Section>

          {/* Strengths & Weaknesses */}
          <div className="rpt-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Section>
              <SLabel color="rgba(52,211,153,0.65)">Strengths</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {strengths.map((s: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'rgba(203,213,225,0.7)', lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))}
              </div>
            </Section>
            <Section>
              <SLabel color="rgba(248,113,113,0.65)">Weaknesses</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {weaknesses.map((w: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M2 2l5 5M7 2L2 7" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'rgba(203,213,225,0.7)', lineHeight: 1.6 }}>{w}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Skills */}
          <div className="rpt-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Section>
              <SLabel color="rgba(165,180,252,0.65)">Matched Skills</SLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {matched_skills.map((s: string, i: number) => <SkillPill key={i} label={s} variant="matched" />)}
              </div>
            </Section>
            <Section>
              <SLabel color="rgba(253,186,116,0.65)">Skill Gaps</SLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {skill_gaps.map((s: string, i: number) => <SkillPill key={i} label={s} variant="gap" />)}
              </div>
            </Section>
          </div>

          {/* Suggestions */}
          <Section>
            <SLabel>Actionable Suggestions</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {repo_suggestions.map((s: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#818cf8', fontFamily: 'Manrope, sans-serif' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'rgba(203,213,225,0.7)', lineHeight: 1.7 }}>{s}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Top repos */}
          {top_repos.length > 0 && (
            <Section>
              <SLabel>Top Repositories</SLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {top_repos.map((r: string, i: number) => (
                  <a key={i} href={`https://github.com/${profile?.username}/${r}`}
                    target="_blank" rel="noopener noreferrer" className="rpt-repo-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    {r}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button className="rpt-btn-ghost" onClick={copyLink}>
              {copied ? (
                <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '7px' }}><path d="M2 7l3.5 3.5L12 3" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied!</>
              ) : 'Copy share link'}
            </button>
            <Link href="/" className="rpt-btn-primary">Analyse another →</Link>
          </div>

        </div>
      </main>
    </>
  );
}