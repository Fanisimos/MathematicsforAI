import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { C, Curve, Dot, Handle, Plot, Seg, usePlot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { fmt, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { NUM_GENS } from './gens_num';

function Path({ pts, color, dashed }: { pts: [number, number][]; color: string; dashed?: boolean }) {
  const { sx, sy } = usePlot();
  const d = pts.filter(([x, y]) => isFinite(x) && isFinite(y) && Math.abs(x) < 1e4 && Math.abs(y) < 1e4).map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join('');
  return <path d={d} fill="none" style={{ stroke: color }} strokeWidth={2.2} strokeDasharray={dashed ? '5 4' : undefined} strokeLinejoin="round" />;
}

/* ── 1. Jacobi vs Gauss–Seidel in 2D ────────────────────── */
const XSTAR: [number, number] = [1, 2];

function JacobiGS() {
  const [a11, setA11] = useState(4);
  const [a12, setA12] = useState(1);
  const [a21, setA21] = useState(2);
  const [a22, setA22] = useState(3);
  const [x0, setX0] = useState<[number, number]>([-3, -2.5]);
  const [k, setK] = useState(8);
  const b1 = a11 * XSTAR[0] + a12 * XSTAR[1];
  const b2 = a21 * XSTAR[0] + a22 * XSTAR[1];
  const { jac, gs } = useMemo(() => {
    const J: [number, number][] = [x0], G: [number, number][] = [x0];
    for (let i = 0; i < 25; i++) {
      const [p, q] = J[J.length - 1];
      J.push([(b1 - a12 * q) / a11, (b2 - a21 * p) / a22]);
      const [u, v] = G[G.length - 1];
      const nu = (b1 - a12 * v) / a11;
      G.push([nu, (b2 - a21 * nu) / a22]);
    }
    return { jac: J, gs: G };
  }, [a11, a12, a21, a22, x0, b1, b2]);
  // draw GS as a staircase (x update, then y update)
  const gsStairs: [number, number][] = [gs[0]];
  for (let i = 1; i <= k; i++) {
    gsStairs.push([gs[i][0], gs[i - 1][1]]);
    gsStairs.push(gs[i]);
  }
  const rhoJ = Math.sqrt(Math.abs((a12 * a21) / (a11 * a22)));
  const rhoG = rhoJ * rhoJ;
  const dd = Math.abs(a11) > Math.abs(a12) && Math.abs(a22) > Math.abs(a21);
  const err = (p: [number, number]) => Math.hypot(p[0] - XSTAR[0], p[1] - XSTAR[1]);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -4, xMax: 5, yMin: -4, yMax: 5 }} width={412} height={398} ariaLabel="Jacobi and Gauss-Seidel iterates">
          {Math.abs(a12) > 1e-9 ? <Curve f={(x) => (b1 - a11 * x) / a12} color={C.muted} width={1.5} /> : <Seg x1={b1 / a11} y1={-9} x2={b1 / a11} y2={9} color={C.muted} width={1.5} />}
          {Math.abs(a22) > 1e-9 && <Curve f={(x) => (b2 - a21 * x) / a22} color={C.muted} width={1.5} dashed />}
          <Path pts={jac.slice(0, k + 1)} color={C.tangent} />
          <Path pts={gsStairs} color={C.curve} />
          {jac.slice(1, k + 1).map((p, i) => <Dot key={`j${i}`} x={p[0]} y={p[1]} r={3.5} color={C.tangent} stroke="none" />)}
          {gs.slice(1, k + 1).map((p, i) => <Dot key={`g${i}`} x={p[0]} y={p[1]} r={3.5} color={C.curve} stroke="none" />)}
          <Dot x={XSTAR[0]} y={XSTAR[1]} r={7} color={C.good} />
          <Handle x={x0[0]} y={x0[1]} onDrag={(x, y) => setX0([Math.round(x * 10) / 10, Math.round(y * 10) / 10])} color={C.secant} r={7} />
        </Plot>
        <div className="legend-row">
          <span style={{ color: C.tangent }}>● Jacobi</span>
          <span style={{ color: C.curve }}>● Gauss–Seidel</span>
          <span style={{ color: C.good }}>● solution (1, 2)</span>
          <span style={{ color: C.secant }}>● start (drag)</span>
        </div>
      </div>
      <div className="explore-side">
        <Tex block>{`\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}\\mathbf x = \\begin{pmatrix} ${fmt(b1)} \\\\ ${fmt(b2)} \\end{pmatrix}`}</Tex>
        <div className="two-col">
          <div>
            <Slider label="$a_{11}$" value={a11} min={0.5} max={6} step={0.5} onChange={setA11} />
            <Slider label="$a_{21}$" value={a21} min={-6} max={6} step={0.5} onChange={setA21} />
          </div>
          <div>
            <Slider label="$a_{12}$" value={a12} min={-6} max={6} step={0.5} onChange={setA12} />
            <Slider label="$a_{22}$" value={a22} min={0.5} max={6} step={0.5} onChange={setA22} />
          </div>
        </div>
        <Slider label="iterations shown" value={k} min={0} max={25} step={1} onChange={setK} format={(v) => `${v}`} />
        <div className="stat-row">
          <Stat label="Jacobi error" value={err(jac[k]).toExponential(1)} tone={err(jac[k]) < 1e-3 ? 'good' : rhoJ >= 1 ? 'bad' : undefined} />
          <Stat label="G–S error" value={err(gs[k]).toExponential(1)} tone={err(gs[k]) < 1e-3 ? 'good' : rhoG >= 1 ? 'bad' : undefined} />
        </div>
        <div className="stat-row">
          <Stat label="$\rho_J$" value={fmt(rhoJ, 3)} tone={rhoJ < 1 ? 'good' : 'bad'} />
          <Stat label="$\rho_{GS} = \rho_J^2$" value={fmt(rhoG, 3)} tone={rhoG < 1 ? 'good' : 'bad'} />
          <Stat label="diag. dominant?" value={dd ? 'yes ✓' : 'no'} tone={dd ? 'good' : 'warn'} />
        </div>
        <Callout tone={rhoJ < 1 ? 'info' : 'warn'} icon={rhoJ < 1 ? '🎯' : '💥'}>
          <MathText>
            {rhoJ < 1
              ? 'Both converge because the **spectral radius** $\\rho < 1$: each step shrinks the error by about $\\rho$. Gauss–Seidel uses new values immediately, so here it is twice as fast ($\\rho_J^2$).'
              : 'Spectral radius $\\ge 1$: the error grows each step and the iteration **diverges**. Make the diagonal bigger than the off-diagonal entries (diagonal dominance) to fix it.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. 3×3 iteration table ─────────────────────────────── */
const A3 = [[10, -1, 2], [-1, 11, -1], [2, -1, 10]];
const B3 = [6, 22, -10];
function IterTable() {
  const [method, setMethod] = useState<'jac' | 'gs'>('gs');
  const rows = useMemo(() => {
    let x = [0, 0, 0];
    const out = [x];
    for (let k = 0; k < 8; k++) {
      const n = [...x];
      for (let i = 0; i < 3; i++) {
        const src = method === 'gs' ? n : x;
        let s = B3[i];
        for (let j = 0; j < 3; j++) if (j !== i) s -= A3[i][j] * src[j];
        n[i] = s / A3[i][i];
      }
      x = n;
      out.push(x);
    }
    return out;
  }, [method]);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={method} onChange={setMethod} options={[{ value: 'jac', label: 'Jacobi' }, { value: 'gs', label: 'Gauss–Seidel' }]} />
        <table className="tt">
          <thead>
            <tr><th>k</th><th>x₁</th><th>x₂</th><th>x₃</th><th>change</th></tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <motion.tr key={`${method}${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.07 }}>
                <td className="mono">{k}</td>
                {r.map((v, i) => <td key={i} className="mono">{v.toFixed(5)}</td>)}
                <td className="mono">{k ? Math.max(...r.map((v, i) => Math.abs(v - rows[k - 1][i]))).toExponential(1) : '–'}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="explore-side">
        <Tex block>{'\\begin{aligned} 10x_1 - x_2 + 2x_3 &= 6 \\\\ -x_1 + 11x_2 - x_3 &= 22 \\\\ 2x_1 - x_2 + 10x_3 &= -10 \\end{aligned}'}</Tex>
        <Tex block>{method === 'jac' ? 'x_1^{(k+1)} = \\frac{6 + x_2^{(k)} - 2x_3^{(k)}}{10}' : 'x_2^{(k+1)} = \\frac{22 + x_1^{(\\color{#22d3ee}k+1)} + x_3^{(k)}}{11}'}</Tex>
        <Callout tone="info" icon="🔁">
          <MathText>{'Solve each equation for "its own" variable and keep re-plugging. Exact answer: $(1, 2, -1)$. Stop when the **change** between iterations is below a tolerance.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Fixed-point iteration: cobweb ───────────────────── */
const GS: { key: string; label: string; g: Fn; dg: Fn; view: [number, number]; x0: number; fp: number }[] = [
  { key: 'cos', label: '$\\cos x$', g: Math.cos, dg: (x) => -Math.sin(x), view: [-0.2, 1.6], x0: 0.1, fp: 0.7390851332 },
  { key: 'lin', label: '$\\tfrac{x}{2} + 1$', g: (x) => x / 2 + 1, dg: () => 0.5, view: [-1, 4], x0: -0.5, fp: 2 },
  { key: 'sqrt2', label: '$\\tfrac12(x + \\tfrac2x)$', g: (x) => (x + 2 / x) / 2, dg: (x) => 0.5 - 1 / (x * x), view: [0.5, 3], x0: 2.8, fp: Math.SQRT2 },
  { key: 'log28', label: '$2.8x(1-x)$', g: (x) => 2.8 * x * (1 - x), dg: (x) => 2.8 - 5.6 * x, view: [0, 1], x0: 0.1, fp: 1 - 1 / 2.8 },
  { key: 'log33', label: '$3.3x(1-x)$', g: (x) => 3.3 * x * (1 - x), dg: (x) => 3.3 - 6.6 * x, view: [0, 1], x0: 0.1, fp: 1 - 1 / 3.3 },
  { key: 'div', label: '$1.5x - 0.5$', g: (x) => 1.5 * x - 0.5, dg: () => 1.5, view: [-1, 3], x0: 1.15, fp: 1 },
];

function Cobweb() {
  const [k, setK] = useState('cos');
  const G = GS.find((g) => g.key === k)!;
  const [x0, setX0] = useState(G.x0);
  const [n, setN] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    setX0(G.x0);
    setN(0);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.clearInterval(timer.current), []);
  const xs = [x0];
  for (let i = 0; i < 40; i++) xs.push(G.g(xs[i]));
  const web: [number, number][] = [[x0, 0]];
  for (let i = 0; i < n; i++) {
    web.push([xs[i], xs[i + 1]]);
    web.push([xs[i + 1], xs[i + 1]]);
  }
  const [lo, hi] = G.view;
  const play = () => {
    window.clearInterval(timer.current);
    setN(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= 20) window.clearInterval(timer.current);
    }, 280);
  };
  const last = xs[n];
  const slope = G.dg(G.fp);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={k} onChange={setK} options={GS.map((g) => ({ value: g.key, label: g.label }))} />
        <Plot view={{ xMin: lo, xMax: hi, yMin: lo, yMax: hi }} width={440} height={426} ariaLabel="Cobweb diagram">
          <Seg x1={lo - 5} y1={lo - 5} x2={hi + 5} y2={hi + 5} color={C.muted} dashed width={1.5} />
          <Curve f={G.g} />
          <Path pts={web} color={C.secant} />
          <Dot x={x0} y={0} color={C.tangent} />
          {n > 0 && <Dot x={last} y={last} color={C.secant} r={5} />}
          <Handle x={x0} y={lo + (hi - lo) * 0.02} lockY onDrag={(x) => { setX0(x); setN(0); }} color={C.tangent} r={7} />
        </Plot>
        <p className="plot-caption">Go up to the curve, across to y = x, repeat. Drag the pink start point.</p>
      </div>
      <div className="explore-side">
        <button className="btn btn-primary" onClick={play}>▶ Iterate</button>
        <Slider label="iterations" value={n} min={0} max={20} step={1} onChange={setN} format={(v) => `${v}`} />
        <Tex block>{`x_{${n}} = ${fmt(last, 6)}`}</Tex>
        <Stat label="$|g'(x^*)|$ at the fixed point" value={isFinite(slope) ? fmt(Math.abs(slope), 3) : '—'} tone={Math.abs(slope) < 1 ? 'good' : 'bad'} />
        <Callout tone={Math.abs(slope) < 1 ? 'info' : 'warn'} icon="🕸️">
          <MathText>
            {k === 'sqrt2'
              ? 'This is Newton\'s method for $\\sqrt2$ in disguise: $g\'(x^*) = 0$, so it converges **incredibly** fast.'
              : k === 'log33'
                ? 'Here $|g\'(x^*)| > 1$: the fixed point repels, and the iterates settle into a **2-cycle** instead. (The doorway to chaos!)'
                : k === 'div'
                  ? '$|g\'| = 1.5 > 1$: each step pushes you further from the fixed point $x^* = 1$. **Diverges**.'
                  : 'Fixed-point iteration $x_{k+1} = g(x_k)$ converges when $|g\'(x^*)| < 1$ near the fixed point. A spiral means $g\' < 0$, a staircase means $g\' > 0$.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function Iterative() {
  return (
    <>
      <Section id="jacobi" kicker="Iterative methods" title="Guess, improve, repeat" intro="Instead of eliminating, start from a guess and repeatedly improve it. For huge sparse systems (millions of unknowns) this beats Gaussian elimination by miles.">
        <JacobiGS />
      </Section>

      <Section id="table" kicker="By hand" title="Watching the digits settle">
        <IterTable />
      </Section>

      <Section id="cobweb" kicker="Fixed points" title="Cobweb diagrams" intro="Any equation can be rearranged as $x = g(x)$. Iterating $x_{k+1} = g(x_k)$ either spirals in, walks in, or flies off.">
        <Cobweb />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Formulas">
        <div className="rules-grid">
          <RuleCard title="Jacobi" tex="x_i^{(k+1)} = \frac{1}{a_{ii}}\Big(b_i - \sum_{j\neq i} a_{ij}x_j^{(k)}\Big)" note="uses only old values" />
          <RuleCard title="Gauss–Seidel" tex="x_i^{(k+1)} = \frac{1}{a_{ii}}\Big(b_i - \sum_{j<i} a_{ij}x_j^{(k+1)} - \sum_{j>i} a_{ij}x_j^{(k)}\Big)" note="uses new values as soon as they exist" />
          <RuleCard title="Diagonal dominance" tex="|a_{ii}| > \sum_{j\neq i}|a_{ij}|" note="guarantees both converge" />
          <RuleCard title="Convergence" tex="\rho(T) < 1" note="spectral radius of the iteration matrix" />
          <RuleCard title="Stopping rule" tex="\|\mathbf x^{(k+1)} - \mathbf x^{(k)}\| < \text{tol}" />
          <RuleCard title="Fixed point" tex="x_{k+1} = g(x_k),\ |g'(x^*)| < 1" />
        </div>
      </Section>

      <MatlabSection topic="iterative" />

      <Section id="practice" kicker="Practice" title="Iterative methods drills">
        <Quiz id="w7-iter-quiz" title="Iterative Methods Drills" blurb="Jacobi and Gauss–Seidel steps, diagonal dominance and fixed-point iteration." gens={NUM_GENS.iterative} />
      </Section>
    </>
  );
}
