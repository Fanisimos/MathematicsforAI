import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { MatrixView } from '../components/Matrix';
import { C, Curve, Dot, Plot, Seg } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Slider, Stat } from '../components/UI';
import { fmt, shuffle } from '../lib/math';
import { backSub, eliminationSteps, niceSystem } from '../lib/linalg';
import { addXp, recordBest } from '../lib/progress';
import { MatlabSection } from '../matlab/MatlabSection';
import { NUM_GENS } from './gens_num';

/* ── 1. Two equations, two lines ────────────────────────── */
function TwoLines() {
  const [a, setA] = useState([1, 1, 3]);
  const [b, setB] = useState([1, -1, 1]);
  const det = a[0] * b[1] - a[1] * b[0];
  const sol = Math.abs(det) > 1e-9 ? [(a[2] * b[1] - a[1] * b[2]) / det, (a[0] * b[2] - a[2] * b[0]) / det] : null;
  // parallel: consistent iff rows proportional including RHS
  const consistent = !sol && Math.abs(a[0] * b[2] - a[2] * b[0]) < 1e-9 && Math.abs(a[1] * b[2] - a[2] * b[1]) < 1e-9;
  const status = sol ? 'unique' : consistent ? 'infinite' : 'none';
  const line = (r: number[], color: string, dashed?: boolean) =>
    Math.abs(r[1]) > 1e-9 ? <Curve f={(x) => (r[2] - r[0] * x) / r[1]} color={color} dashed={dashed} /> : Math.abs(r[0]) > 1e-9 ? <Seg x1={r[2] / r[0]} y1={-20} x2={r[2] / r[0]} y2={20} color={color} width={3} dashed={dashed} /> : null;
  const sl = (arr: number[], set: (v: number[]) => void, i: number, label: string) => (
    <Slider label={label} value={arr[i]} min={-4} max={4} step={0.5} onChange={(v) => set(arr.map((w, j) => (j === i ? v : w)))} />
  );
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -5, xMax: 5, yMin: -4, yMax: 4 }} height={330} ariaLabel="Two linear equations as lines">
          {line(a, C.tangent)}
          {line(b, C.curve, status === 'infinite')}
          {sol && <Dot x={sol[0]} y={sol[1]} r={8} color={C.good} />}
        </Plot>
      </div>
      <div className="explore-side">
        <Tex block>{`\\begin{cases} ${fmt(a[0])}x + ${fmt(a[1])}y = ${fmt(a[2])} \\\\ ${fmt(b[0])}x + ${fmt(b[1])}y = ${fmt(b[2])} \\end{cases}`.replace(/\+ -/g, '- ')}</Tex>
        <div className="two-col">
          <div>
            {sl(a, setA, 0, '$a_{11}$')}
            {sl(a, setA, 1, '$a_{12}$')}
            {sl(a, setA, 2, '$b_1$')}
          </div>
          <div>
            {sl(b, setB, 0, '$a_{21}$')}
            {sl(b, setB, 1, '$a_{22}$')}
            {sl(b, setB, 2, '$b_2$')}
          </div>
        </div>
        <div className="stat-row">
          <Stat label="det A" value={fmt(det)} tone={Math.abs(det) < 1e-9 ? 'bad' : 'accent'} />
          <Stat label="solutions" value={status === 'unique' ? `(${fmt(sol![0])}, ${fmt(sol![1])})` : status === 'infinite' ? '∞ many' : 'none'} tone={status === 'unique' ? 'good' : 'warn'} />
        </div>
        <Tex block>{`\\underbrace{\\begin{pmatrix} ${fmt(a[0])} & ${fmt(a[1])} \\\\ ${fmt(b[0])} & ${fmt(b[1])} \\end{pmatrix}}_{A}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\underbrace{\\begin{pmatrix} ${fmt(a[2])} \\\\ ${fmt(b[2])} \\end{pmatrix}}_{\\mathbf b}`}</Tex>
        <Callout tone={status === 'unique' ? 'good' : 'warn'} icon={status === 'unique' ? '✅' : status === 'infinite' ? '♾️' : '🚫'}>
          <MathText>
            {status === 'unique'
              ? 'The lines cross once: **one solution**, and $\\det A \\neq 0$.'
              : status === 'infinite'
                ? 'Same line twice: **infinitely many** solutions. $\\det A = 0$.'
                : 'Parallel lines never meet: **no solution**. $\\det A = 0$. Try making the slopes equal but the intercepts different.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Gaussian elimination stepper ───────────────────── */
function GaussStepper() {
  const [sys, setSys] = useState(() => niceSystem(3));
  const steps = useMemo(() => eliminationSteps(sys.A, sys.b), [sys]);
  const [mode, setMode] = useState<'watch' | 'play'>('watch');
  const [k, setK] = useState(0); // number of elimination steps applied
  const [bk, setBk] = useState(0); // back-substitution steps revealed
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const M0 = sys.A.map((r, i) => [...r, sys.b[i]]);
  const M = k === 0 ? M0 : steps[k - 1].M;
  const next = steps[k];
  const doneElim = k >= steps.length;
  const U = M.map((r) => r.slice(0, 3));
  const c = M.map((r) => r[3]);
  const x = doneElim ? backSub(U, c) : [];
  const choices = useMemo(() => {
    if (!next) return [];
    const m = next.m;
    const piv = M[next.k][next.k];
    return shuffle([...new Set([m, -m, piv === 0 ? m + 1 : 1 / m, m + (m > 0 ? 1 : -1), M[next.i][next.k]])].slice(0, 4)).map((v) => Number(v.toFixed(3)));
  }, [k, sys]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = (s = niceSystem(3)) => {
    setSys(s);
    setK(0);
    setBk(0);
    setWrong(null);
    setMistakes(0);
    setCelebrate(false);
  };
  const pickM = (v: number) => {
    if (!next) return;
    if (Math.abs(v - next.m) < 1e-9) {
      setWrong(null);
      const nk = k + 1;
      setK(nk);
      if (nk >= steps.length) {
        const pct = Math.max(0, 1 - mistakes / Math.max(1, steps.length));
        recordBest('w4-elim', pct);
        addXp(Math.round(20 * pct) + 5);
        setCelebrate(mistakes === 0);
      }
    } else {
      setWrong(v);
      setMistakes((m) => m + 1);
    }
  };
  const varName = ['x_1', 'x_2', 'x_3'];
  const backLines = [2, 1, 0].map((i) => {
    const terms = [0, 1, 2].filter((j) => j > i).map((j) => `${fmt(U[i][j])}(${fmt(x[j])})`);
    return `${varName[i]} = \\frac{${fmt(c[i])}${terms.length ? ' - ' + terms.join(' - ') : ''}}{${fmt(U[i][i])}} = ${fmt(x[i])}`;
  });

  return (
    <Card className="game">
      {celebrate && <Confetti count={50} />}
      <div className="game-head">
        <div>
          <span className="quiz-badge">{mode === 'play' ? '🎮 Your turn' : '▶ Watch'}</span>
          <h3>Gaussian Elimination</h3>
          <p className="muted">Make zeros below each pivot (yellow), one row operation at a time. Then solve from the bottom up.</p>
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className={`chip ${mode === 'watch' ? 'active' : ''}`} onClick={() => { setMode('watch'); reset(sys); }}>Watch</button>
          <button className={`chip ${mode === 'play' ? 'active' : ''}`} onClick={() => { setMode('play'); reset(sys); }}>I'll do it</button>
          <button className="chip" onClick={() => reset()}>🎲 New system</button>
        </div>
      </div>
      <div className="explore">
        <div className="explore-plot">
          <div className="gauss-board">
            <MatrixView m={M} aug={3} digits={3} pivot={next ? [next.k, next.k] : undefined} hiRows={next ? [next.i] : []} rowLabels={['R1', 'R2', 'R3']} label="[ A | b ]" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={k} className="step-desc" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {next ? (
                mode === 'watch' ? (
                  <MathText>{`Next: **${next.desc}** to make entry $(${next.i + 1},${next.k + 1})$ zero. Multiplier $m = \\frac{${fmt(M[next.i][next.k])}}{${fmt(M[next.k][next.k])}} = ${fmt(next.m, 3)}$.`}</MathText>
                ) : (
                  <MathText>{`To zero entry $(${next.i + 1},${next.k + 1})$ we do $R_${next.i + 1} \\leftarrow R_${next.i + 1} - m\\,R_${next.k + 1}$. **What is $m$?**`}</MathText>
                )
              ) : (
                <MathText>{'**Upper triangular!** Now back-substitute, starting from the last row.'}</MathText>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="explore-side">
          {next && mode === 'watch' && (
            <div className="btn-row" style={{ marginTop: 0 }}>
              <button className="btn btn-ghost" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>← Back</button>
              <button className="btn btn-primary" onClick={() => setK(k + 1)}>Apply step →</button>
            </div>
          )}
          {next && mode === 'play' && (
            <div className="choices">
              {choices.map((v) => (
                <motion.button key={`${k}-${v}`} className={`choice ${wrong === v ? 'wrong' : ''}`} onClick={() => pickM(v)} animate={wrong === v ? { x: [0, -6, 6, -4, 4, 0] } : {}}>
                  <span className="mono">m = {fmt(v, 3)}</span>
                </motion.button>
              ))}
            </div>
          )}
          {next && mode === 'play' && wrong !== null && (
            <p className="hint">
              <MathText>{'Hint: $m$ = (entry to kill) ÷ (pivot above it).'}</MathText>
            </p>
          )}
          {doneElim && (
            <div className="steps">
              {backLines.slice(0, bk).map((l, i) => (
                <motion.div key={i} className="step-line" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                  <Tex>{l}</Tex>
                </motion.div>
              ))}
              {bk < 3 ? (
                <button className="btn btn-primary" onClick={() => setBk(bk + 1)}>Solve for {['x₃', 'x₂', 'x₁'][bk]} →</button>
              ) : (
                <div className="feedback good">
                  <strong>
                    Solution: x = ({x.map((v) => fmt(v)).join(', ')}){mode === 'play' ? ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ''}
                  </strong>
                  <button className="btn btn-primary" onClick={() => reset()}>Another system</button>
                </div>
              )}
            </div>
          )}
          <Stat label="step" value={`${k}/${steps.length}`} />
        </div>
      </div>
    </Card>
  );
}

export default function LinSys() {
  return (
    <>
      <Section id="lines" kicker="Linear systems" title="Solving = finding where lines meet" intro="Each linear equation in two unknowns is a line. A solution of the system is a point on **every** line at once. Play with the coefficients.">
        <TwoLines />
      </Section>

      <Section id="gauss" kicker="Gaussian elimination" title="The algorithm behind A\b" intro="For bigger systems we can't draw pictures, so we use an algorithm. Row operations don't change the solution, so we use them to make the matrix **upper triangular**.">
        <GaussStepper />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Rules of the game">
        <div className="rules-grid">
          <RuleCard title="Matrix form" tex="A\mathbf x = \mathbf b" note="augmented matrix $[A \mid \mathbf b]$" />
          <RuleCard title="Allowed row operations" tex="R_i \leftarrow R_i - m R_k" note="also: swap rows, scale a row by $\neq 0$" />
          <RuleCard title="Multiplier" tex="m_{ik} = \frac{a_{ik}}{a_{kk}}" note="$a_{kk}$ is the pivot" />
          <RuleCard title="Back substitution" tex="x_i = \frac{c_i - \sum_{j>i} u_{ij}x_j}{u_{ii}}" note="last row first" />
          <RuleCard title="Three outcomes" tex="\text{one} \mid \text{none} \mid \infty" note="one solution exactly when $\det A \neq 0$" />
          <RuleCard title="Partial pivoting" tex="\text{swap in the largest } |a_{ik}|" note="avoids dividing by 0 or tiny numbers" />
          <RuleCard title="Cost" tex="\approx \tfrac{2}{3}n^3 \text{ operations}" note="doubling $n$ = 8× the work" />
        </div>
      </Section>

      <MatlabSection topic="linsys" />

      <Section id="practice" kicker="Practice" title="Linear systems drills">
        <Quiz id="w4-quiz" title="Linear Systems Drills" blurb="Solve 2×2 systems, classify solution types, elimination multipliers and back substitution." gens={NUM_GENS.linsys} />
      </Section>
    </>
  );
}
