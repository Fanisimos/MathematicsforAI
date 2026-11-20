import { useEffect, useRef, useState } from 'react';

/** Looping gradient-descent animation for the landing page. */
const W = 560, H = 300;
const f = (x: number) => 0.09 * x * x + 0.55 * Math.sin(1.7 * x) + 0.25 * Math.cos(3.1 * x);
const df = (x: number) => 0.18 * x + 0.935 * Math.cos(1.7 * x) - 0.775 * Math.sin(3.1 * x);
const X0 = -6, X1 = 6, Y0 = -1.4, Y1 = 4.2;
const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => H - ((y - Y0) / (Y1 - Y0)) * H;

const path = (() => {
  let d = '';
  for (let i = 0; i <= 300; i++) {
    const x = X0 + ((X1 - X0) * i) / 300;
    d += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(f(x)).toFixed(1)}`;
  }
  return d;
})();

export function HeroDescent() {
  const [ball, setBall] = useState({ x: -5.2, trail: [] as number[] });
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (reduced.current) return;
    let x = -5.2, trail: number[] = [], still = 0, raf = 0, last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 45) return;
      last = t;
      const g = df(x);
      const nx = x - 0.35 * g;
      trail = [...trail.slice(-26), x];
      still = Math.abs(nx - x) < 0.004 ? still + 1 : 0;
      x = nx;
      if (still > 25) {
        x = (Math.random() < 0.5 ? -1 : 1) * (3.5 + Math.random() * 2);
        trail = [];
        still = 0;
      }
      setBall({ x, trail });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hero-svg" aria-hidden>
      <defs>
        <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={`${path} L${W} ${H} L0 ${H} Z`} fill="url(#heroFill)" />
      <path d={path} fill="none" stroke="url(#heroStroke)" strokeWidth={4} strokeLinecap="round" />
      {ball.trail.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(f(x))} r={2 + (i / ball.trail.length) * 4} fill="#f472b6" opacity={(i / ball.trail.length) * 0.6} />
      ))}
      <line x1={sx(ball.x) - 40} x2={sx(ball.x) + 40} y1={sy(f(ball.x)) + 40 * df(ball.x) * (H / (Y1 - Y0)) / (W / (X1 - X0))} y2={sy(f(ball.x)) - 40 * df(ball.x) * (H / (Y1 - Y0)) / (W / (X1 - X0))} stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" opacity={0.8} />
      <circle cx={sx(ball.x)} cy={sy(f(ball.x))} r={11} fill="#f472b6" filter="url(#glow)" />
      <text x={W - 10} y={22} textAnchor="end" className="hero-eq">x ← x − α·f′(x)</text>
    </svg>
  );
}
