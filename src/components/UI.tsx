import { motion } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';
import { fmt } from '../lib/math';
import { MathText, Tex } from './Tex';

export function Section({ id, kicker, title, children, intro }: { id: string; kicker: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <motion.section
      id={id}
      className="section"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="section-head">
        <span className="kicker">{kicker}</span>
        <h2>{title}</h2>
        {intro && (
          <p className="lead">
            <MathText>{intro}</MathText>
          </p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

export function Card({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="slider">
      <span className="slider-label">
        <MathText>{label}</MathText>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
      />
      <span className="slider-val mono">{format ? format(value) : fmt(value)}</span>
    </label>
  );
}

export function Tabs<T extends string>({ value, options, onChange, small }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div className={`tabs ${small ? 'tabs-sm' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          <MathText>{o.label}</MathText>
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'bad' | 'warn' | 'accent' }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <span className="stat-label">
        <MathText>{label}</MathText>
      </span>
      <span className="stat-value mono">{value}</span>
    </div>
  );
}

export function RuleCard({ title, tex, note }: { title: string; tex: string; note?: string }) {
  return (
    <motion.div className="rule-card" whileHover={{ y: -4, rotate: -0.4 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
      <span className="rule-title">{title}</span>
      <Tex block>{tex}</Tex>
      {note && (
        <span className="rule-note">
          <MathText>{note}</MathText>
        </span>
      )}
    </motion.div>
  );
}

export function Callout({ children, tone = 'info', icon }: { children: ReactNode; tone?: 'info' | 'ai' | 'warn' | 'good'; icon?: string }) {
  return (
    <div className={`callout callout-${tone}`}>
      {icon && <span className="callout-icon">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

export function Confetti({ count = 70 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 900,
        y: -Math.random() * 500 - 150,
        r: Math.random() * 720 - 360,
        c: ['#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'][i % 5],
        d: 0.9 + Math.random() * 0.8,
        w: 6 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          style={{ background: b.c, width: b.w, height: b.w * 0.45 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 650], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: b.d * 1.6, ease: 'easeOut', times: [0, 0.4, 1] }}
        />
      ))}
    </div>
  );
}

export function ProgressRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ring" aria-label={`${Math.round(pct * 100)}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="ring-fg"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, pct))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle">
        {Math.round(pct * 100)}
      </text>
    </svg>
  );
}
