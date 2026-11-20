import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaFill, C, Curve, DataRect, Dot, Plot, Seg, TextAt, usePlot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { fmt, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { NUM_GENS } from './gens_num';
import { autoView } from './shared';

type IF = { key: string; label: string; tex: string; f: Fn; a: number; b: number; exact: number };
const IFS: IF[] = [
  { key: 'gauss', label: '$e^{-x^2}$', tex: 'e^{-x^2}', f: (x) => Math.exp(-x * x), a: 0, b: 2, exact: 0.882081390762422 },
  { key: 'sin', label: '$\\sin x$', tex: '\\sin x', f: Math.sin, a: 0, b: Math.PI, exact: 2 },
  { key: 'sqrt', label: '$\\sqrt{x}$', tex: '\\sqrt{x}', f: Math.sqrt, a: 0, b: 4, exact: 16 / 3 },
  { key: 'cubic', label: '$x^3 - 2x + 1$', tex: 'x^3 - 2x + 1', f: (x) => x ** 3 - 2 * x + 1, a: -1, b: 2, exact: 3.75 },
  { key: 'wig', label: '$1 + \\sin(3x)/2$', tex: '1 + \\tfrac12\\sin 3x', f: (x) => 1 + Math.sin(3 * x) / 2, a: 0, b: 3, exact: 3 + (1 - Math.cos(9)) / 6 },
];
type Rule = 'trap' | 'mid' | 'simp';

export function composite(f: Fn, a: number, b: number, n: number, rule: Rule) {
  const h = (b - a) / n;
  let s = 0;
  if (rule === 'trap') {
    s = (f(a) + f(b)) / 2;
    for (let i = 1; i < n; i++) s += f(a + i * h);
    return s * h;
  }
  if (rule === 'mid') {
    for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
    return s * h;
  }
  s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Draw the parabola through 3 points for each Simpson panel. */
function SimpsonArcs({ f, a, b, n }: { f: Fn; a: number; b: number; n: number }) {
  const h = (b - a) / n;
  const arcs = [];
  for (let i = 0; i < n; i += 2) {
    const x0 = a + i * h, x1 = x0 + h, x2 = x0 + 2 * h;
    const y0 = f(x0), y1 = f(x1), y2 = f(x2);
    const q: Fn = (x) => y0 * ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2)) + y1 * ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2)) + y2 * ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
    arcs.push(
      <g key={i}>
        <AreaFill f={q} from={x0} to={x2} samples={30} color={C.area} opacity={0.38} />
        <Curve f={q} from={x0} to={x2} color={C.secant} width={1.5} samples={30} />
        <Seg x1={x2} y1={0} x2={x2} y2={y2} color={C.area} width={1} />
      </g>,
    );
  }
  return <>{arcs}</>;
}

/* ── 1. Rule comparator ─────────────────────────────────── */
function RuleComparator() {
  const [fk, setFk] = useState('gauss');
  const [rule, setRule] = useState<Rule>('simp');
  const [n, setN] = useState(4);
  const F = IFS.find((d) => d.key === fk)!;
  const view = useMemo(() => autoView(F.f, F.a - 0.3, F.b + 0.3, 0.15, 20), [F]);
  const nn = rule === 'simp' && n % 2 ? n + 1 : n;
  const h = (F.b - F.a) / nn;
  const approx = composite(F.f, F.a, F.b, nn, rule);
  const err = approx - F.exact;
  const evals = rule === 'mid' ? nn : nn + 1;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={fk} onChange={setFk} options={IFS.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={view} height={330} ariaLabel="Numerical integration rule">
          {rule === 'trap' &&
            Array.from({ length: nn }, (_, i) => {
              const x0 = F.a + i * h, y0 = F.f(x0), y1 = F.f(x0 + h);
              return <AreaFill key={i} f={(x) => y0 + ((y1 - y0) * (x - x0)) / h} from={x0} to={x0 + h} samples={1} color={C.area} opacity={0.38} />;
            })}
          {rule === 'trap' && Array.from({ length: nn + 1 }, (_, i) => <Seg key={`s${i}`} x1={F.a + i * h} y1={0} x2={F.a + i * h} y2={F.f(F.a + i * h)} color={C.area} width={1} />)}
          {rule === 'mid' && Array.from({ length: nn }, (_, i) => <DataRect key={i} x={F.a + i * h} y={0} w={h} h={F.f(F.a + (i + 0.5) * h)} color={C.area} opacity={0.38} />)}
          {rule === 'simp' && <SimpsonArcs f={F.f} a={F.a} b={F.b} n={nn} />}
          <Curve f={F.f} />
          {Array.from({ length: rule === 'mid' ? nn : nn + 1 }, (_, i) => {
            const x = rule === 'mid' ? F.a + (i + 0.5) * h : F.a + i * h;
            return <Dot key={`p${i}`} x={x} y={F.f(x)} r={3.5} color={C.secant} stroke="none" />;
          })}
        </Plot>
        <p className="plot-caption">Yellow dots = function evaluations{rule === 'simp' ? ' · yellow arcs = Simpson parabolas' : ''}</p>
      </div>
      <div className="explore-side">
        <Tabs small value={rule} onChange={setRule} options={[{ value: 'trap', label: 'Trapezium' }, { value: 'mid', label: 'Midpoint' }, { value: 'simp', label: 'Simpson' }]} />
        <Slider label="$n$ strips" value={n} min={1} max={32} step={1} onChange={setN} format={(v) => `${rule === 'simp' && v % 2 ? v + 1 : v}`} />
        <Tex block>{`\\int_{${fmt(F.a)}}^{${fmt(F.b, 3)}} ${F.tex}\\,dx`}</Tex>
        <div className="stat-row">
          <Stat label="approx" value={approx.toFixed(8)} tone="warn" />
          <Stat label="exact" value={F.exact.toFixed(8)} tone="accent" />
        </div>
        <div className="stat-row">
          <Stat label="error" value={Math.abs(err) < 1e-15 ? '0' : err.toExponential(2)} tone={Math.abs(err) < 1e-6 ? 'good' : 'bad'} />
          <Stat label="f evaluations" value={evals} />
        </div>
        {fk === 'cubic' && rule === 'simp' && (
          <Callout tone="good" icon="🎯">
            <MathText>{'Simpson is **exact** for cubics (error = 0 for any even $n$), even though it only fits parabolas. A happy accident of symmetry.'}</MathText>
          </Callout>
        )}
        {fk === 'gauss' && (
          <Callout tone="ai" icon="🔔">
            <MathText>{'$\\int e^{-x^2}dx$ has **no formula** in elementary functions, yet it is the bell curve behind every normal probability. Numerical integration is the only way.'}</MathText>
          </Callout>
        )}
        {fk === 'sqrt' && (
          <Callout tone="warn" icon="🐢">
            <MathText>{'$\\sqrt x$ has infinite slope at 0, so the error formulas (which need smooth derivatives) break down and convergence is slower than promised.'}</MathText>
          </Callout>
        )}
      </div>
    </div>
  );
}

/* ── 2. Convergence on log-log axes ─────────────────────── */
function LogPath({ pts, color }: { pts: [number, number][]; color: string }) {
  const { sx, sy } = usePlot();
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)} ${sy(y)}`).join('');
  return <path d={d} fill="none" style={{ stroke: color }} strokeWidth={2.5} />;
}

function Convergence() {
  const [fk, setFk] = useState('gauss');
  const F = IFS.find((d) => d.key === fk)!;
  const ns = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
  const data = (['trap', 'mid', 'simp'] as Rule[]).map((rule) => ({
    rule,
    pts: ns.map((n) => [Math.log10((F.b - F.a) / n), Math.log10(Math.max(1e-16, Math.abs(composite(F.f, F.a, F.b, n, rule) - F.exact)))] as [number, number]),
  }));
  const slope = (pts: [number, number][]) => {
    const good = pts.filter(([, y]) => y > -13.5).slice(1, 5);
    if (good.length < 2) return NaN;
    return (good[good.length - 1][1] - good[0][1]) / (good[good.length - 1][0] - good[0][0]);
  };
  const colors: Record<Rule, string> = { trap: C.tangent, mid: C.curve, simp: C.good };
  const names: Record<Rule, string> = { trap: 'Trapezium', mid: 'Midpoint', simp: 'Simpson' };
  const ratio = (rule: Rule, n: number) => Math.abs(composite(F.f, F.a, F.b, n, rule) - F.exact) / Math.abs(composite(F.f, F.a, F.b, 2 * n, rule) - F.exact);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={fk} onChange={setFk} options={IFS.filter((d) => d.key !== 'cubic').map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={{ xMin: -3.2, xMax: 0.4, yMin: -16, yMax: 0.5 }} height={330} xLabel="log₁₀ h" yLabel="log₁₀ |error|" ariaLabel="Error versus step size on log-log axes">
          {data.map((d) => (
            <g key={d.rule}>
              <LogPath pts={d.pts} color={colors[d.rule]} />
              {d.pts.map(([x, y], i) => <Dot key={i} x={x} y={y} r={3.5} color={colors[d.rule]} stroke="none" />)}
            </g>
          ))}
          <TextAt x={-3.1} y={-15.2} color={C.muted} size={12}>machine precision floor</TextAt>
        </Plot>
        <div className="legend-row">
          {data.map((d) => (
            <span key={d.rule} style={{ color: colors[d.rule] }}>
              ● {names[d.rule]} (slope ≈ {fmt(slope(d.pts), 1)})
            </span>
          ))}
        </div>
      </div>
      <div className="explore-side">
        <table className="tt compact">
          <thead>
            <tr><th>n → 2n</th><th>Trap ratio</th><th>Simpson ratio</th></tr>
          </thead>
          <tbody>
            {[4, 8, 16, 32].map((n) => (
              <tr key={n}>
                <td className="mono">{n} → {2 * n}</td>
                <td className="mono">{fmt(ratio('trap', n), 2)}</td>
                <td className="mono">{fmt(ratio('simp', n), 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Callout tone="info" icon="📉">
          <MathText>{'On log–log axes, error $\\approx Ch^p$ is a straight line with **slope $p$**. Trapezium and midpoint have $p = 2$: halving $h$ divides the error by $2^2 = 4$. Simpson has $p = 4$: halving $h$ divides it by $2^4 = 16$.'}</MathText>
        </Callout>
        <Callout tone="warn" icon="🧱">
          <MathText>{'Simpson flattens out near $10^{-15}$: that is rounding error (machine epsilon), not the method. Past that point more strips cannot help.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Monte Carlo ─────────────────────────────────────── */
function MonteCarlo() {
  const f: Fn = (x) => Math.exp(-x * x);
  const a = 0, b = 2, M = 1.05;
  const exact = 0.882081390762422;
  const [pts, setPts] = useState<[number, number, boolean][]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const addN = (k: number) =>
    setPts((old) => {
      const add: [number, number, boolean][] = Array.from({ length: k }, () => {
        const x = a + Math.random() * (b - a), y = Math.random() * M;
        return [x, y, y <= f(x)];
      });
      return [...old, ...add].slice(-8000);
    });
  const auto = () => {
    window.clearInterval(timer.current);
    let i = 0;
    timer.current = window.setInterval(() => {
      addN(60);
      if (++i > 60) window.clearInterval(timer.current);
    }, 60);
  };
  const hits = pts.filter((p) => p[2]).length;
  const est = pts.length ? (hits / pts.length) * (b - a) * M : 0;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -0.1, xMax: 2.1, yMin: -0.05, yMax: 1.1 }} height={300} ariaLabel="Monte Carlo darts under a curve">
          <Seg x1={a} y1={M} x2={b} y2={M} color={C.muted} dashed width={1} />
          {pts.map((p, i) => <Dot key={i} x={p[0]} y={p[1]} r={1.8} color={p[2] ? C.good : C.bad} stroke="none" opacity={0.8} />)}
          <Curve f={f} color={C.text} width={2.5} />
        </Plot>
      </div>
      <div className="explore-side">
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn btn-primary" onClick={() => addN(100)}>🎯 +100 darts</button>
          <button className="btn btn-ghost" onClick={auto}>Rain ▶</button>
          <button className="btn btn-ghost" onClick={() => setPts([])}>Clear</button>
        </div>
        <Tex block>{`\\text{area} \\approx \\frac{\\text{hits}}{\\text{darts}}\\times\\text{box} = \\frac{${hits}}{${pts.length}}\\times ${fmt((b - a) * M, 2)} = ${fmt(est, 4)}`}</Tex>
        <div className="stat-row">
          <Stat label="estimate" value={fmt(est, 4)} tone="warn" />
          <Stat label="exact" value={fmt(exact, 4)} tone="accent" />
          <Stat label="darts" value={pts.length} />
        </div>
        <Callout tone="ai" icon="🎲">
          <MathText>{'Monte Carlo error shrinks like $1/\\sqrt N$: 100× more darts for 10× more accuracy. Terrible in 1D, but it is the **only** method that still works in 1000 dimensions, which is why AI (Bayesian inference, reinforcement learning) uses it everywhere.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function NumInt() {
  return (
    <>
      <Section id="rules-compare" kicker="Numerical integration" title="When there is no formula" intro="Replace the curve by simple shapes you **can** integrate: straight lines (trapezium), flat tops (midpoint) or parabolas (Simpson).">
        <RuleComparator />
      </Section>

      <Section id="convergence" kicker="Error & convergence" title="How fast does the error shrink?">
        <Convergence />
      </Section>

      <Section id="montecarlo" kicker="Randomness" title="Monte Carlo: integration by throwing darts">
        <MonteCarlo />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Formulas">
        <div className="rules-grid">
          <RuleCard title="Composite trapezium" tex="T_n = h\Big[\tfrac{f_0}{2} + f_1 + \dots + f_{n-1} + \tfrac{f_n}{2}\Big]" note="error $= O(h^2)$" />
          <RuleCard title="Composite midpoint" tex="M_n = h\sum_{i} f\big(x_i + \tfrac h2\big)" note="error $= O(h^2)$, about half the trapezium's" />
          <RuleCard title="Composite Simpson" tex="S_n = \tfrac h3\big[f_0 + 4f_1 + 2f_2 + 4f_3 + \dots + f_n\big]" note="$n$ even, error $= O(h^4)$" />
          <RuleCard title="Trapezium error bound" tex="|E| \le \frac{(b-a)h^2}{12}\max|f''|" />
          <RuleCard title="Simpson error bound" tex="|E| \le \frac{(b-a)h^4}{180}\max|f^{(4)}|" note="so exact for cubics" />
          <RuleCard title="Halving h" tex="E \div 4 \ (\text{trap}),\quad E \div 16 \ (\text{Simpson})" />
          <RuleCard title="Monte Carlo" tex="\int_a^b f \approx \frac{b-a}{N}\sum f(x_i)" note="error $\sim 1/\sqrt N$" />
        </div>
      </Section>

      <MatlabSection topic="numint" />

      <Section id="practice" kicker="Practice" title="Numerical integration drills">
        <Quiz id="w10-numint-quiz" title="Numerical Integration Drills" blurb="Trapezium and Simpson by hand, error orders and Monte Carlo estimates." gens={NUM_GENS.numint} />
      </Section>
    </>
  );
}

