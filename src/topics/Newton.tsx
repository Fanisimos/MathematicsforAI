import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Field, FieldArrow } from '../components/Field';
import { MatrixView } from '../components/Matrix';
import { C, Curve, Dot, Handle, Plot, Seg, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { deriv, fmt, tween, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { NUM_GENS } from './gens_num';

/* ── 1. Newton in 1D ────────────────────────────────────── */
type NF = { key: string; label: string; tex: string; f: Fn; view: { xMin: number; xMax: number; yMin: number; yMax: number }; x0: number; note: string };
const cbrt = (x: number) => Math.sign(x) * Math.abs(x) ** (1 / 3);
const NFS: NF[] = [
  { key: 'sqrt2', label: '$x^2 - 2$', tex: 'x^2 - 2', f: (x) => x * x - 2, view: { xMin: -0.5, xMax: 3.5, yMin: -3, yMax: 8 }, x0: 3, note: 'Finds $\\sqrt2$. Watch the number of correct digits roughly **double** every step: quadratic convergence.' },
  { key: 'cubic', label: '$x^3 - 2x - 5$', tex: 'x^3 - 2x - 5', f: (x) => x ** 3 - 2 * x - 5, view: { xMin: 0, xMax: 4, yMin: -10, yMax: 40 }, x0: 3.5, note: "Newton's own example from 1669. Root ≈ 2.0946." },
  { key: 'cos', label: '$\\cos x - x$', tex: '\\cos x - x', f: (x) => Math.cos(x) - x, view: { xMin: -1, xMax: 3, yMin: -3, yMax: 1.5 }, x0: 2.5, note: "No algebraic formula for this root, but Newton doesn't care." },
  { key: 'cycle', label: 'cycle: $x^3 - 2x + 2$', tex: 'x^3 - 2x + 2', f: (x) => x ** 3 - 2 * x + 2, view: { xMin: -2.5, xMax: 2, yMin: -4, yMax: 6 }, x0: 0, note: 'From $x_0 = 0$: $x_1 = 1$, $x_2 = 0$, … stuck in a **2-cycle** forever. Drag the start point to escape.' },
  { key: 'cbrt', label: 'diverge: $\\sqrt[3]{x}$', tex: '\\sqrt[3]{x}', f: cbrt, view: { xMin: -8, xMax: 8, yMin: -2.5, yMax: 2.5 }, x0: 0.5, note: 'Each step **doubles** the distance from the root: $x_{n+1} = -2x_n$. Newton diverges.' },
];

function Newton1D() {
  const [k, setK] = useState('sqrt2');
  const F = NFS.find((n) => n.key === k)!;
  const [x0, setX0] = useState(F.x0);
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState(1);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => {
    setX0(F.x0);
    setN(0);
    return () => cancel.current();
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const xs = useMemo(() => {
    const out = [x0];
    for (let i = 0; i < 12; i++) {
      const x = out[i];
      const d = deriv(F.f, x);
      out.push(Math.abs(d) < 1e-14 ? NaN : x - F.f(x) / d);
    }
    return out;
  }, [x0, F]);
  const step = () => {
    if (n >= 12) return;
    setN(n + 1);
    setPhase(0);
    cancel.current = tween(700, (t) => setPhase(t));
  };
  const root = F.key === 'cycle' || F.key === 'cbrt' ? NaN : xs[12];
  const cur = xs[n];
  const prev = n > 0 ? xs[n - 1] : NaN;
  const slope = n > 0 ? deriv(F.f, prev) : NaN;
  const digits = (x: number) => (isFinite(root) && isFinite(x) ? Math.max(0, Math.min(15, Math.floor(-Math.log10(Math.abs(x - root) || 1e-16)))) : 0);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={k} onChange={setK} options={NFS.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={F.view} height={330} ariaLabel="Newton's method">
          <Curve f={F.f} />
          {xs.slice(0, Math.max(0, n - 1)).map((x, i) => (
            <g key={i} opacity={0.35}>
              <Seg x1={x} y1={0} x2={x} y2={F.f(x)} color={C.muted} dashed width={1} />
              <Seg x1={x} y1={F.f(x)} x2={xs[i + 1]} y2={0} color={C.tangent} width={1.5} />
            </g>
          ))}
          {n > 0 && isFinite(prev) && (
            <>
              <Seg x1={prev} y1={0} x2={prev} y2={F.f(prev) * Math.min(1, phase * 2)} color={C.secant} dashed />
              {phase > 0.5 && <Seg x1={prev} y1={F.f(prev)} x2={prev + (cur - prev) * Math.min(1, (phase - 0.5) * 2)} y2={F.f(prev) + slope * (cur - prev) * Math.min(1, (phase - 0.5) * 2)} color={C.tangent} width={2.5} />}
            </>
          )}
          {xs.slice(0, n + 1).map((x, i) => (isFinite(x) ? <Dot key={`d${i}`} x={x} y={0} r={i === n ? 7 : 4} color={i === n ? C.good : C.muted} stroke="none" /> : null))}
          {n === 0 && <Handle x={x0} y={0} lockY onDrag={(x) => setX0(Math.round(x * 100) / 100)} color={C.secant} r={8} />}
          {n === 0 && <TextAt x={x0} y={0} dy={-14} anchor="middle" color={C.secant}>x₀</TextAt>}
        </Plot>
        <p className="plot-caption">Drag x₀, then step: go up to the curve, slide down the tangent to the axis.</p>
      </div>
      <div className="explore-side">
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn btn-primary" onClick={step} disabled={n >= 12}>Newton step →</button>
          <button className="btn btn-ghost" onClick={() => setN(0)}>Reset</button>
        </div>
        <Tex block>{n > 0 ? `x_{${n}} = x_{${n - 1}} - \\frac{f(x_{${n - 1}})}{f'(x_{${n - 1}})} = ${fmt(prev, 5)} - \\frac{${fmt(F.f(prev), 5)}}{${fmt(slope, 5)}} = ${fmt(cur, 6)}` : `x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}`}</Tex>
        <table className="tt compact">
          <thead>
            <tr><th>n</th><th>xₙ</th><th>f(xₙ)</th>{isFinite(root) && <th>correct digits</th>}</tr>
          </thead>
          <tbody>
            {xs.slice(0, n + 1).map((x, i) => (
              <tr key={i} className={i === n ? 'cur' : ''}>
                <td className="mono">{i}</td>
                <td className="mono">{isFinite(x) ? x.toPrecision(12) : '—'}</td>
                <td className="mono">{isFinite(x) ? F.f(x).toExponential(2) : '—'}</td>
                {isFinite(root) && <td className="mono">{'█'.repeat(digits(x))} {digits(x)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <Callout tone={F.key === 'cycle' || F.key === 'cbrt' ? 'warn' : 'info'} icon={F.key === 'cycle' || F.key === 'cbrt' ? '⚠️' : '🚀'}>
          <MathText>{F.note}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. The race ────────────────────────────────────────── */
function Race() {
  const f = (x: number) => x * x - 2;
  const root = Math.SQRT2;
  const runs = useMemo(() => {
    const bis: number[] = [], sec: number[] = [], nwt: number[] = [];
    let a = 1, b = 2;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      bis.push(Math.abs(m - root));
      if (f(a) * f(m) <= 0) b = m;
      else a = m;
    }
    let x0 = 1, x1 = 2;
    for (let i = 0; i < 40; i++) {
      const d = f(x1) - f(x0);
      const x2 = d === 0 ? x1 : x1 - (f(x1) * (x1 - x0)) / d;
      sec.push(Math.abs(x2 - root));
      x0 = x1;
      x1 = x2;
    }
    let x = 2;
    for (let i = 0; i < 40; i++) {
      x = x - f(x) / (2 * x);
      nwt.push(Math.abs(x - root));
    }
    return [
      { name: 'Bisection', color: C.secant, e: bis, order: 'linear: error ÷ 2 per step' },
      { name: 'Secant', color: C.curve2, e: sec, order: 'superlinear (order ≈ 1.618)' },
      { name: 'Newton', color: C.good, e: nwt, order: 'quadratic: digits double' },
    ];
  }, []);
  const [it, setIt] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const go = useCallback(() => {
    window.clearInterval(timer.current);
    setIt(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i++;
      setIt(i);
      if (i >= 40) window.clearInterval(timer.current);
    }, 160);
  }, []);
  const target = 1e-12;
  const digitsOf = (e: number) => Math.max(0, Math.min(16, -Math.log10(e || 1e-17)));
  return (
    <div className="explore">
      <div className="explore-plot">
        <div className="race">
          {runs.map((r) => {
            const e = it ? r.e[it - 1] : 1;
            const winAt = r.e.findIndex((v) => v < target) + 1;
            const finished = winAt > 0 && it >= winAt;
            return (
              <div key={r.name} className="race-lane">
                <span className="race-name" style={{ color: r.color }}>{r.name}</span>
                <div className="race-track">
                  <motion.div className="race-runner" style={{ background: r.color }} animate={{ width: `${(digitsOf(e) / 16) * 100}%` }} transition={{ duration: 0.15 }} />
                  <span className="race-goal" style={{ left: `${(12 / 16) * 100}%` }} />
                </div>
                <span className="mono race-val">{finished ? `🏁 ${winAt} steps` : `${fmt(digitsOf(e), 1)} digits`}</span>
              </div>
            );
          })}
        </div>
        <p className="plot-caption">Bar length = number of correct digits of √2. Flag = 12 digits.</p>
      </div>
      <div className="explore-side">
        <button className="btn btn-primary btn-lg" onClick={go}>🏁 Start the race</button>
        <Stat label="iteration" value={it} />
        <ul className="stationary-list">
          {runs.map((r) => (
            <li key={r.name} style={{ borderColor: r.color }}>
              <strong>{r.name}</strong>: {r.order}
            </li>
          ))}
        </ul>
        <Callout tone="info" icon="⚖️">
          <MathText>{"Bisection is slow but **can't fail** once you bracket a root. Newton is blazing fast but needs $f'$ and a good start. Real solvers (like MATLAB's `fzero`) combine them."}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Multivariable Newton & basins ───────────────────── */
// F(x, y) = (x² + y² − 4, x·y − 1)
const F2 = (x: number, y: number): [number, number] => [x * x + y * y - 4, x * y - 1];
const J2 = (x: number, y: number) => [[2 * x, 2 * y], [y, x]];
const R = Math.sqrt(2 + Math.sqrt(3)), r = Math.sqrt(2 - Math.sqrt(3));
const ROOTS: [number, number][] = [[R, 1 / R], [r, 1 / r], [-R, -1 / R], [-r, -1 / r]];
const RC: [number, number, number][] = [[244, 114, 182], [34, 211, 238], [251, 191, 36], [167, 139, 250]];

function newtonPath(x: number, y: number, n = 30) {
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < n; i++) {
    const [f1, f2] = F2(x, y);
    const [[a, b], [c, d]] = J2(x, y);
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-12) break;
    const dx = (-f1 * d + b * f2) / det;
    const dy = (-a * f2 + c * f1) / det;
    x += dx;
    y += dy;
    pts.push([x, y]);
    if (Math.hypot(dx, dy) < 1e-12) break;
  }
  return pts;
}
function basin(x: number, y: number) {
  const p = newtonPath(x, y, 30);
  const [ex, ey] = p[p.length - 1];
  const i = ROOTS.findIndex(([a, b]) => Math.hypot(ex - a, ey - b) < 1e-4);
  return i < 0 ? 4 : i + Math.min(0.9, (p.length - 1) / 40);
}
const paint = (v: number): [number, number, number] => {
  if (v >= 4) return [12, 14, 26];
  const base = RC[Math.floor(v)];
  const shade = 1 - (v % 1) * 0.9;
  return [base[0] * shade * 0.75, base[1] * shade * 0.75, base[2] * shade * 0.75];
};

function MultiNewton() {
  const [start, setStart] = useState<[number, number]>([0.6, -1.4]);
  const [k, setK] = useState(1);
  const path = useMemo(() => newtonPath(start[0], start[1], 12), [start]);
  const kk = Math.min(k, path.length - 1);
  const [cx, cy] = path[Math.max(0, kk - 1)];
  const J = J2(cx, cy);
  const Fv = F2(cx, cy);
  const view = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
  return (
    <div className="explore">
      <div className="explore-plot">
        <Field f={basin} view={view} res={170} paint={paint} onClickPoint={(x, y) => { setStart([x, y]); setK(1); }} ariaLabel="Basins of attraction for Newton's method">
          {({ X, Y }) => {
            const circle = Array.from({ length: 121 }, (_, i) => {
              const t = (i / 120) * 2 * Math.PI;
              return `${X(2 * Math.cos(t))},${Y(2 * Math.sin(t))}`;
            }).join(' ');
            const hyp = (sgn: number) =>
              Array.from({ length: 80 }, (_, i) => {
                const x = sgn * (0.34 + (i / 79) * 2.66);
                return `${X(x)},${Y(1 / x)}`;
              }).join(' ');
            return (
              <>
                <polyline points={circle} fill="none" stroke="white" strokeWidth={2} opacity={0.8} />
                <polyline points={hyp(1)} fill="none" stroke="white" strokeWidth={2} strokeDasharray="6 5" opacity={0.8} />
                <polyline points={hyp(-1)} fill="none" stroke="white" strokeWidth={2} strokeDasharray="6 5" opacity={0.8} />
                {path.slice(0, kk + 1).map((p, i) =>
                  i > 0 ? <FieldArrow key={i} x1={X(path[i - 1][0])} y1={Y(path[i - 1][1])} x2={X(p[0])} y2={Y(p[1])} color="#ffffff" width={2.5} /> : null,
                )}
                <circle cx={X(start[0])} cy={Y(start[1])} r={7} fill={C.secant} stroke="#000" strokeWidth={2} />
                {ROOTS.map(([a, b], i) => (
                  <circle key={i} cx={X(a)} cy={Y(b)} r={6} fill={`rgb(${RC[i].join(',')})`} stroke="#fff" strokeWidth={2} />
                ))}
              </>
            );
          }}
        </Field>
        <p className="plot-caption">Click anywhere to start there. Colour = which root Newton ends up at (darker = more steps).</p>
      </div>
      <div className="explore-side">
        <Tex block>{'\\mathbf F(x,y) = \\begin{pmatrix} x^2 + y^2 - 4 \\\\ xy - 1 \\end{pmatrix} = \\mathbf 0'}</Tex>
        <Slider label="step" value={k} min={1} max={Math.max(1, path.length - 1)} step={1} onChange={setK} format={(v) => `${v}`} />
        <div className="lu-row">
          <MatrixView m={J} label={`J at step ${kk - 1}`} digits={3} />
          <MatrixView m={[[Fv[0]], [Fv[1]]]} label="F" digits={3} />
        </div>
        <Tex block>{`\\mathbf x_{${kk}} = \\begin{pmatrix} ${fmt(path[kk][0], 5)} \\\\ ${fmt(path[kk][1], 5)} \\end{pmatrix}`}</Tex>
        <Callout tone="info" icon="🧮">
          <MathText>{'Each step solves the **linear system** $J\\,\\Delta\\mathbf x = -\\mathbf F$ (Gaussian elimination again!) and updates $\\mathbf x \\leftarrow \\mathbf x + \\Delta\\mathbf x$. The Jacobian $J$ is the matrix of partial derivatives.'}</MathText>
        </Callout>
        <Callout tone="ai" icon="🎨">
          <MathText>{'The coloured map shows **basins of attraction**: which root each starting point leads to. The borders are the lines $y = \\pm x$, exactly where $\\det J = 2(x^2 - y^2) = 0$. Start on them and Newton cannot take a step; start near them and the first step is huge. Your starting guess matters!'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function Newton() {
  return (
    <>
      <Section id="newton" kicker="Newton's method" title="Follow the tangent to the root" intro="To solve $f(x) = 0$: replace the curve by its tangent line, solve that (easy), repeat. Pick a function and press step.">
        <Newton1D />
      </Section>

      <Section id="race" kicker="Speed" title="Bisection vs Secant vs Newton">
        <Race />
      </Section>

      <Section id="multi" kicker="Multivariable Newton" title="Two equations, two unknowns" intro="Same idea in 2D: the derivative becomes the **Jacobian** matrix and dividing by $f'$ becomes solving a linear system. Find where the circle meets the hyperbola.">
        <MultiNewton />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Formulas">
        <div className="rules-grid">
          <RuleCard title="Newton (1D)" tex="x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}" />
          <RuleCard title="Square roots" tex="x_{n+1} = \tfrac12\left(x_n + \tfrac{a}{x_n}\right)" note="Newton on $x^2 - a$" />
          <RuleCard title="Secant" tex="x_{n+1} = x_n - f(x_n)\frac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}" note="no derivative needed" />
          <RuleCard title="Jacobian" tex="J = \begin{pmatrix} \partial f_1/\partial x & \partial f_1/\partial y \\ \partial f_2/\partial x & \partial f_2/\partial y \end{pmatrix}" />
          <RuleCard title="Newton (system)" tex="J(\mathbf x_n)\,\Delta\mathbf x = -\mathbf F(\mathbf x_n)" note="then $\mathbf x_{n+1} = \mathbf x_n + \Delta\mathbf x$" />
          <RuleCard title="Convergence" tex="|e_{n+1}| \approx C|e_n|^2" note="quadratic, near a simple root" />
          <RuleCard title="Failure modes" tex="f'(x_n) \approx 0,\ \text{cycles},\ \text{divergence}" />
        </div>
      </Section>

      <MatlabSection topic="newton" />

      <Section id="practice" kicker="Practice" title="Newton's method drills">
        <Quiz id="w8-newton-quiz" title="Newton Drills" blurb="Newton steps, square roots, Jacobians and why Newton sometimes fails." gens={NUM_GENS.newton} />
      </Section>
    </>
  );
}
