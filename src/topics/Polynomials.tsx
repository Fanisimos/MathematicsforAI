import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { AreaFill, C, Curve, Dot, Handle, Plot, Seg, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat } from '../components/UI';
import { fmt, polyTex, quadRoots, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { FOUND_GENS } from './gens_found';

const r2 = (v: number) => Math.round(v * 100) / 100;

/* ── 1. Quadratic explorer ──────────────────────────────── */
function QuadraticExplorer() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(-2);
  const [c, setC] = useState(-3);
  const f: Fn = (x) => a * x * x + b * x + c;
  const D = b * b - 4 * a * c;
  const roots = Math.abs(a) < 1e-9 ? [] : quadRoots(a, b, c);
  const h = Math.abs(a) < 1e-9 ? NaN : -b / (2 * a);
  const k = f(h);
  const status = D > 1e-9 ? 'Two real roots' : Math.abs(D) <= 1e-9 ? 'One repeated root' : 'No real roots';
  const tone = D > 1e-9 ? 'good' : Math.abs(D) <= 1e-9 ? 'warn' : 'bad';
  const sq = Math.sqrt(Math.abs(D));
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -6, xMax: 6, yMin: -8, yMax: 8 }} height={340} ariaLabel="Quadratic graph">
          <Curve f={f} />
          {isFinite(h) && <Seg x1={h} y1={-20} x2={h} y2={20} color={C.muted} dashed width={1} />}
          {isFinite(h) && <Dot x={h} y={k} color={C.secant} />}
          {roots.map((r) => (
            <Dot key={r} x={r} y={0} color={C.good} r={8} />
          ))}
          {isFinite(h) && <TextAt x={h} y={k} dy={a > 0 ? 22 : -12} anchor="middle" color={C.secant}>vertex</TextAt>}
        </Plot>
      </div>
      <div className="explore-side">
        <Tex block>{`y = ${polyTex([[r2(a), 2], [r2(b), 1], [r2(c), 0]])}`}</Tex>
        <Slider label="$a$" value={a} min={-3} max={3} step={0.1} onChange={setA} />
        <Slider label="$b$" value={b} min={-8} max={8} step={0.1} onChange={setB} />
        <Slider label="$c$" value={c} min={-8} max={8} step={0.1} onChange={setC} />
        <div className="stat-row">
          <Stat label="$\Delta = b^2 - 4ac$" value={fmt(D)} tone={tone} />
          <Stat label="roots" value={status} tone={tone} />
        </div>
        {Math.abs(a) > 1e-9 && (
          <Tex block>{`x = \\frac{-b \\pm\\sqrt{\\Delta}}{2a} = \\frac{${fmt(-b)} \\pm ${D >= 0 ? `\\sqrt{${fmt(D)}}` : `${fmt(sq)}i`}}{${fmt(2 * a)}}${roots.length ? ` = ${roots.map((r) => fmt(r)).join(',\\ ')}` : ''}`}</Tex>
        )}
        {isFinite(h) && <Tex block>{`\\text{vertex form: } y = ${fmt(a)}(x ${h <= 0 ? '+' : '-'} ${fmt(Math.abs(h))})^2 ${k < 0 ? '-' : '+'} ${fmt(Math.abs(k))}`}</Tex>}
        {D < -1e-9 && (
          <Callout tone="info" icon="🌀">
            <MathText>{`Negative discriminant: the parabola never touches the axis. The roots are **complex**: $${fmt(-b / (2 * a))} \\pm ${fmt(sq / Math.abs(2 * a))}i$.`}</MathText>
          </Callout>
        )}
      </div>
    </div>
  );
}

/* ── 2. Roots ↔ factors ─────────────────────────────────── */
function RootsBuilder() {
  const [rs, setRs] = useState([-2, 0.5, 2.5]);
  const [k, setK] = useState(0.5);
  const f: Fn = (x) => k * (x - rs[0]) * (x - rs[1]) * (x - rs[2]);
  const [p, q, s] = rs;
  const coef = [k, -k * (p + q + s), k * (p * q + p * s + q * s), -k * p * q * s];
  const fac = (r: number) => `(x ${r <= 0 ? '+' : '-'} ${fmt(Math.abs(r))})`;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -4, xMax: 4, yMin: -8, yMax: 8 }} height={320} ariaLabel="Cubic built from its roots">
          <AreaFill f={(x) => Math.max(0, f(x))} from={-4} to={4} color={C.good} opacity={0.12} />
          <AreaFill f={(x) => Math.min(0, f(x))} from={-4} to={4} color={C.bad} opacity={0.12} />
          <Curve f={f} />
          {rs.map((r, i) => (
            <Handle key={i} x={r} y={0} lockY onDrag={(x) => setRs(rs.map((v, j) => (j === i ? Math.round(x * 4) / 4 : v)))} color={[C.tangent, C.secant, C.curve2][i]} r={8} />
          ))}
        </Plot>
        <p className="plot-caption">Drag the three roots along the x-axis</p>
      </div>
      <div className="explore-side">
        <Slider label="leading coefficient $k$" value={k} min={-1.5} max={1.5} step={0.05} onChange={(v) => setK(v === 0 ? 0.05 : v)} />
        <Tex block>{`p(x) = ${fmt(k)}${fac(p)}${fac(q)}${fac(s)}`}</Tex>
        <Tex block>{`= ${polyTex([[r2(coef[0]), 3], [r2(coef[1]), 2], [r2(coef[2]), 1], [r2(coef[3]), 0]])}`}</Tex>
        <Callout tone="info" icon="🔑">
          <MathText>{`**Factor theorem:** $r$ is a root ⇔ $(x - r)$ is a factor. Expanding links roots to coefficients: the constant term is $-k\\,r_1r_2r_3 = ${fmt(coef[3])}$, and $-\\frac{\\text{coef of } x^2}{k} = r_1 + r_2 + r_3 = ${fmt(p + q + s)}$.`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Polynomial fitting & overfitting ────────────────── */
function solve(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = col + 1; r < n; r++) {
      const m = M[r][col] / d;
      for (let k = col; k <= n; k++) M[r][k] -= m * M[col][k];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k];
    x[i] = s / (M[i][i] || 1e-12);
  }
  return x;
}

function fit(pts: { x: number; y: number }[], deg: number) {
  const n = deg + 1;
  const sc = (x: number) => x / 3;
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  const b = Array(n).fill(0);
  for (const p of pts) {
    const pw = Array.from({ length: n }, (_, i) => sc(p.x) ** i);
    for (let i = 0; i < n; i++) {
      b[i] += pw[i] * p.y;
      for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j];
    }
  }
  for (let i = 0; i < n; i++) A[i][i] += 1e-9;
  const c = solve(A, b);
  return (x: number) => c.reduce((s, ci, i) => s + ci * sc(x) ** i, 0);
}

const truth = (x: number) => 1.2 * Math.sin(x) + 0.3 * x;
const START = [-2.7, -2.1, -1.4, -0.6, 0.1, 0.8, 1.5, 2.2, 2.8].map((x, i) => ({ x, y: truth(x) + [0.3, -0.4, 0.2, 0.35, -0.3, 0.25, -0.35, 0.3, -0.2][i] }));

function CurveFitter() {
  const [pts, setPts] = useState(START);
  const [deg, setDeg] = useState(1);
  const [showTruth, setShowTruth] = useState(false);
  const p = useMemo(() => fit(pts, deg), [pts, deg]);
  const rmse = Math.sqrt(pts.reduce((s, q) => s + (p(q.x) - q.y) ** 2, 0) / pts.length);
  const over = deg >= pts.length - 1 || deg >= 7;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3.3, xMax: 3.3, yMin: -4, yMax: 4 }} height={330} onClickPoint={(x, y) => setPts([...pts, { x, y }])} ariaLabel="Polynomial fit to data points">
          {showTruth && <Curve f={truth} color={C.muted} dashed width={2} />}
          <Curve f={p} color={over ? C.bad : C.curve} width={3} />
          {pts.map((q, i) => (
            <Dot key={i} x={q.x} y={q.y} r={6} color={C.secant} />
          ))}
        </Plot>
        <p className="plot-caption">Click anywhere to add a data point</p>
      </div>
      <div className="explore-side">
        <Slider label="polynomial degree $n$" value={deg} min={1} max={10} step={1} onChange={setDeg} format={(v) => `${v}`} />
        <div className="stat-row">
          <Stat label="training error (RMSE)" value={fmt(rmse, 3)} tone={rmse < 0.05 ? 'warn' : 'accent'} />
          <Stat label="data points" value={pts.length} />
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => setShowTruth(!showTruth)}>{showTruth ? 'Hide' : 'Show'} true curve</button>
          <button className="btn btn-ghost" onClick={() => setPts(START)}>Reset points</button>
        </div>
        <motion.div key={over ? 'o' : 'f'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Callout tone={over ? 'warn' : 'ai'} icon={over ? '🤪' : '🧠'}>
            <MathText>
              {over
                ? '**Overfitting!** The curve passes (almost) through every point, so the training error is tiny, but it wiggles wildly between them. It memorised the noise. This is the most important idea in machine learning.'
                : 'This is **polynomial regression**, a basic machine-learning model: choose coefficients so the curve is as close as possible to the data. Raise the degree and watch what happens.'}
            </MathText>
          </Callout>
        </motion.div>
      </div>
    </div>
  );
}

export default function Polynomials() {
  return (
    <>
      <Section id="quadratic" kicker="Quadratics" title="Every parabola, one formula" intro="$y = ax^2 + bx + c$. The **discriminant** $\Delta = b^2 - 4ac$ tells you how many times the curve hits the x-axis before you solve anything.">
        <QuadraticExplorer />
      </Section>

      <Section id="roots" kicker="Polynomials" title="Roots ↔ factors" intro="A polynomial is completely determined by its roots and its leading coefficient. Drag the roots and watch the coefficients change.">
        <RootsBuilder />
      </Section>

      <Section id="fit" kicker="AI connection" title="Fitting curves to data">
        <CurveFitter />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Methods for quadratics">
        <div className="rules-grid">
          <RuleCard title="Quadratic formula" tex="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
          <RuleCard title="Discriminant" tex="\Delta = b^2 - 4ac" note="$>0$ two roots, $=0$ one, $<0$ none real" />
          <RuleCard title="Completing the square" tex="a(x - h)^2 + k,\quad h = -\tfrac{b}{2a}" note="vertex at $(h, k)$" />
          <RuleCard title="Factorising" tex="x^2 + bx + c = (x - r_1)(x - r_2)" note="$r_1 r_2 = c$, $r_1 + r_2 = -b$" />
          <RuleCard title="Factor theorem" tex="p(a) = 0 \iff (x - a) \mid p(x)" />
          <RuleCard title="Degree n" tex="\text{at most } n \text{ real roots}" note="exactly $n$ complex roots (with repeats)" />
        </div>
      </Section>

      <MatlabSection topic="polynomials" />

      <Section id="practice" kicker="Practice" title="Quadratics & polynomial drills">
        <Quiz id="w2-poly-quiz" title="Polynomial Drills" blurb="Discriminants, solving quadratics, vertex form, the factor theorem and matching graphs." gens={FOUND_GENS.polynomials} />
      </Section>
    </>
  );
}
