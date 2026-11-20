import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { MatrixView, VectorView } from '../components/Matrix';
import { C, Curve, Dot, Plot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, RuleCard, Section, Slider, Stat } from '../components/UI';
import { fmt, randInt } from '../lib/math';
import { backSub, clone, forwardSub, matVec, niceSystem, normInf, solveLowPrecision } from '../lib/linalg';
import { MatlabSection } from '../matlab/MatlabSection';
import { NUM_GENS } from './gens_num';

/* ── 1. LU factorisation stepper ────────────────────────── */
function LUStepper() {
  const [sys, setSys] = useState(() => niceSystem(3));
  const [k, setK] = useState(0);
  const [b, setB] = useState(sys.b);
  const snaps = useMemo(() => {
    const n = 3;
    const U = clone(sys.A);
    const L = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const out = [{ L: clone(L), U: clone(U), hi: null as null | [number, number], desc: 'Start: L = I, U = A' }];
    for (let c = 0; c < n - 1; c++)
      for (let i = c + 1; i < n; i++) {
        const m = U[i][c] / U[c][c];
        L[i][c] = m;
        for (let j = c; j < n; j++) U[i][j] -= m * U[c][j];
        U[i][c] = 0;
        out.push({ L: clone(L), U: clone(U), hi: [i, c], desc: `m = ${fmt(m, 3)}: store it in L(${i + 1},${c + 1}), and do R${i + 1} − m·R${c + 1} in U` });
      }
    return out;
  }, [sys]);
  const S = snaps[Math.min(k, snaps.length - 1)];
  const done = k >= snaps.length - 1;
  const y = forwardSub(sys.L, b);
  const x = backSub(sys.U, y);
  const newSys = () => {
    const s = niceSystem(3);
    setSys(s);
    setB(s.b);
    setK(0);
  };
  return (
    <Card>
      <div className="lu-row">
        <MatrixView m={sys.A} label="A" />
        <span className="op">=</span>
        <MatrixView m={S.L} label="L (multipliers)" hiCells={S.hi ? [S.hi] : []} />
        <MatrixView m={S.U} label="U (eliminated)" hiRows={S.hi ? [S.hi[0]] : []} />
      </div>
      <p className="step-desc">{S.desc}</p>
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>← Back</button>
        <button className="btn btn-primary" onClick={() => setK(k + 1)} disabled={done}>Next elimination step →</button>
        <button className="btn btn-ghost" onClick={newSys}>🎲 New matrix</button>
      </div>
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lu-solve">
          <Callout tone="good" icon="♻️">
            <MathText>{'Factorised once. Now solving $A\\mathbf x = \\mathbf b$ for **any** $\\mathbf b$ is two cheap triangular solves: $L\\mathbf y = \\mathbf b$ (forward), then $U\\mathbf x = \\mathbf y$ (back).'}</MathText>
          </Callout>
          <div className="lu-row">
            <VectorView v={b} label="b" />
            <span className="op">→</span>
            <VectorView v={y} label="y = L⁻¹b (forward)" />
            <span className="op">→</span>
            <VectorView v={x} label="x = U⁻¹y (back)" />
          </div>
          <button className="btn btn-primary" onClick={() => setB(matVec(sys.A, [randInt(-3, 4), randInt(-3, 4), randInt(-3, 4)]))}>🎲 New right-hand side b (no re-factorising!)</button>
        </motion.div>
      )}
    </Card>
  );
}

function CostChart() {
  const [n, setN] = useState(1000);
  const [rhs, setRhs] = useState(100);
  const ge = rhs * ((2 / 3) * n ** 3);
  const lu = (2 / 3) * n ** 3 + rhs * 2 * n * n;
  const big = Math.max(ge, lu);
  const sci = (v: number) => v.toExponential(2).replace('e+', ' × 10^');
  return (
    <div className="explore">
      <div className="explore-plot">
        <div className="cost-bars">
          <div className="cost-row">
            <span>Gaussian elimination every time</span>
            <motion.div className="cost-bar bad" animate={{ width: `${(ge / big) * 100}%` }} />
            <span className="mono">{sci(ge)}</span>
          </div>
          <div className="cost-row">
            <span>LU once + substitutions</span>
            <motion.div className="cost-bar good" animate={{ width: `${Math.max(1, (lu / big) * 100)}%` }} />
            <span className="mono">{sci(lu)}</span>
          </div>
        </div>
        <Stat label="speed-up" value={`${fmt(ge / lu, 1)}×`} tone="good" />
      </div>
      <div className="explore-side">
        <Slider label="matrix size $n$" value={n} min={10} max={5000} step={10} onChange={setN} format={(v) => `${v}`} />
        <Slider label="number of right-hand sides" value={rhs} min={1} max={500} step={1} onChange={setRhs} format={(v) => `${v}`} />
        <p className="muted small">
          <MathText>{'Elimination costs about $\\tfrac23 n^3$ operations, each triangular solve about $n^2$ (forward + back = $2n^2$).'}</MathText>
        </p>
      </div>
    </div>
  );
}

/* ── 2. Floating point ──────────────────────────────────── */
function FloatFacts() {
  const facts = [
    { code: '0.1 + 0.2', val: String(0.1 + 0.2) },
    { code: '0.1 + 0.2 == 0.3', val: String(0.1 + 0.2 === 0.3) },
    { code: 'eps  (= 2^-52)', val: String(2 ** -52) },
    { code: '1 + eps/2 == 1', val: String(1 + 2 ** -53 === 1) },
    { code: '(1e16 + 1) - 1e16', val: String(1e16 + 1 - 1e16) },
    { code: 'realmax  (largest double)', val: String(Number.MAX_VALUE) },
  ];
  return (
    <div className="float-grid">
      {facts.map((f, i) => (
        <motion.div key={f.code} className="float-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <code>{f.code}</code>
          <span className="mono">{f.val}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── 3. Condition number ────────────────────────────────── */
function Conditioning() {
  const [lg, setLg] = useState(-1); // log10 δ
  const [eps, setEps] = useState(0.02);
  const d = 10 ** lg;
  // A = [[1,1],[1,1+d]], exact x = (1,1), b = (2, 2+d)
  const det = d;
  const invInf = Math.max(Math.abs(1 + d) + 1, 1 + 1) / det;
  const kappa = (2 + d) * invInf;
  const b2 = 2 + d + eps;
  const xp = [((1 + d) * 2 - b2) / det, (b2 - 2) / det];
  const relX = normInf([xp[0] - 1, xp[1] - 1]) / 1;
  const relB = Math.abs(eps) / (2 + d);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3, xMax: 5, yMin: -3, yMax: 5 }} height={320} ariaLabel="Nearly parallel lines">
          <Curve f={(x) => 2 - x} color={C.tangent} />
          <Curve f={(x) => (2 + d - x) / (1 + d)} color={C.curve} />
          <Curve f={(x) => (b2 - x) / (1 + d)} color={C.secant} dashed />
          <Dot x={1} y={1} color={C.good} r={7} />
          <Dot x={xp[0]} y={xp[1]} color={C.secant} r={7} />
        </Plot>
        <p className="plot-caption">Green = true solution (1, 1). Yellow = solution after nudging b₂ by ε.</p>
      </div>
      <div className="explore-side">
        <Tex block>{`A = \\begin{pmatrix} 1 & 1 \\\\ 1 & ${fmt(1 + d, 5)} \\end{pmatrix}`}</Tex>
        <Slider label="how parallel: $\delta$" value={lg} min={-4} max={0} step={0.05} onChange={setLg} format={(v) => (10 ** v).toExponential(1)} />
        <Slider label="nudge to $b_2$: $\varepsilon$" value={eps} min={-0.05} max={0.05} step={0.001} onChange={setEps} format={(v) => fmt(v, 3)} />
        <div className="stat-row">
          <Stat label="$\kappa_\infty(A)$" value={kappa > 1e4 ? kappa.toExponential(1) : fmt(kappa, 0)} tone={kappa > 100 ? 'bad' : 'good'} />
          <Stat label="rel. change in b" value={`${fmt(relB * 100, 2)}%`} />
          <Stat label="rel. change in x" value={`${relX > 100 ? relX.toExponential(1) : fmt(relX * 100, 1)}%`} tone={relX > 0.1 ? 'bad' : 'good'} />
        </div>
        <Tex block>{`\\frac{\\|\\delta \\mathbf x\\|}{\\|\\mathbf x\\|} \\le \\kappa(A)\\,\\frac{\\|\\delta \\mathbf b\\|}{\\|\\mathbf b\\|}`}</Tex>
        <Callout tone="warn" icon="🎢">
          <MathText>{'Nearly parallel lines = **ill-conditioned** system: a tiny change in the data swings the answer wildly. $\\kappa(A) = \\|A\\|\\,\\|A^{-1}\\|$ is the amplification factor. Rule of thumb: you lose about $\\log_{10}\\kappa$ correct digits.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 4. Iterative refinement ────────────────────────────── */
const HILB = [[1, 1 / 2, 1 / 3], [1 / 2, 1 / 3, 1 / 4], [1 / 3, 1 / 4, 1 / 5]];
const XTRUE = [1, 1, 1];
const BH = matVec(HILB, XTRUE);

function Refinement() {
  const [s, setS] = useState(3);
  const rows = useMemo(() => {
    const out: { x: number[]; err: number; res: number }[] = [];
    let x = solveLowPrecision(HILB, BH, s);
    for (let k = 0; k <= 5; k++) {
      const r = BH.map((bi, i) => bi - matVec(HILB, x)[i]); // residual in full (double) precision
      out.push({ x, err: normInf(x.map((v, i) => v - XTRUE[i])), res: normInf(r) });
      const d = solveLowPrecision(HILB, r, s);
      x = x.map((v, i) => v + d[i]);
    }
    return out;
  }, [s]);
  return (
    <div className="explore">
      <div className="explore-plot">
        <table className="tt refine">
          <thead>
            <tr>
              <th>k</th>
              <th>x₁</th>
              <th>x₂</th>
              <th>x₃</th>
              <th>error ‖x − x*‖∞</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <motion.tr key={`${s}-${k}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.08 }}>
                <td className="mono">{k}</td>
                {r.x.map((v, i) => (
                  <td key={i} className="mono">{v.toFixed(7)}</td>
                ))}
                <td className={`mono ${r.err < 1e-6 ? 't' : r.err > 1e-2 ? 'f' : ''}`}>{r.err.toExponential(2)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <p className="plot-caption">Solving the 3×3 Hilbert system (true answer x* = (1, 1, 1), κ ≈ 748)</p>
      </div>
      <div className="explore-side">
        <Slider label="solver precision (significant figures)" value={s} min={2} max={6} step={1} onChange={setS} format={(v) => `${v}`} />
        <ol className="recipe">
          <li><MathText>{'Solve $A\\mathbf x_0 = \\mathbf b$ (low precision).'}</MathText></li>
          <li><MathText>{'Residual $\\mathbf r = \\mathbf b - A\\mathbf x_k$ in **high** precision.'}</MathText></li>
          <li><MathText>{'Solve $A\\mathbf d = \\mathbf r$ (reuse the LU factors).'}</MathText></li>
          <li><MathText>{'Update $\\mathbf x_{k+1} = \\mathbf x_k + \\mathbf d$, repeat.'}</MathText></li>
        </ol>
        <Callout tone="info" icon="🔧">
          <MathText>{'Each round fixes more digits. How many depends on solver precision versus conditioning: at 5 significant figures each round gains about 3 digits; at 2 figures the first answer is way off and refinement only crawls towards the truth. If the solver were too crude for $\\kappa(A)$, it would not converge at all.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function LU() {
  return (
    <>
      <Section id="lu" kicker="LU decomposition" title="Eliminate once, solve many times" intro="Gaussian elimination secretly factorises $A = LU$: $U$ is the triangular result and $L$ just stores the multipliers. Step through it.">
        <LUStepper />
      </Section>

      <Section id="cost" kicker="Why bother?" title="The payoff">
        <CostChart />
      </Section>

      <Section id="error" kicker="Error estimates" title="Computers can't count (exactly)" intro="Real numbers are stored with about 16 significant digits (IEEE double precision, same in MATLAB and in this page). These are computed live in your browser:">
        <FloatFacts />
        <div className="rules-grid two" style={{ marginTop: 16 }}>
          <RuleCard title="Absolute error" tex="|x - \hat x|" />
          <RuleCard title="Relative error" tex="\frac{|x - \hat x|}{|x|}" note="≈ how many digits are correct" />
        </div>
      </Section>

      <Section id="cond" kicker="Conditioning" title="When small errors become big ones">
        <Conditioning />
      </Section>

      <Section id="refine" kicker="Iterative refinement" title="Polishing a rough answer">
        <Refinement />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Formulas">
        <div className="rules-grid">
          <RuleCard title="LU factorisation" tex="A = LU" note="$L$ unit lower (multipliers), $U$ upper" />
          <RuleCard title="Solve with LU" tex="L\mathbf y = \mathbf b,\quad U\mathbf x = \mathbf y" />
          <RuleCard title="With pivoting" tex="PA = LU" note="what MATLAB's `lu` returns" />
          <RuleCard title="Residual" tex="\mathbf r = \mathbf b - A\hat{\mathbf x}" note="small residual ≠ small error if ill-conditioned!" />
          <RuleCard title="Condition number" tex="\kappa(A) = \|A\|\,\|A^{-1}\|" note="≥ 1; large = sensitive" />
          <RuleCard title="Error bound" tex="\frac{\|\delta\mathbf x\|}{\|\mathbf x\|} \le \kappa(A)\frac{\|\delta\mathbf b\|}{\|\mathbf b\|}" />
          <RuleCard title="Machine epsilon" tex="\varepsilon = 2^{-52} \approx 2.2\times10^{-16}" />
        </div>
      </Section>

      <MatlabSection topic="lu" />

      <Section id="practice" kicker="Practice" title="LU & error drills">
        <Quiz id="w5-quiz" title="LU & Error Drills" blurb="LU entries, forward substitution, residuals, relative error, condition numbers and floating point." gens={NUM_GENS.lu} />
      </Section>
    </>
  );
}
