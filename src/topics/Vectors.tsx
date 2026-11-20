import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { MatrixView } from '../components/Matrix';
import { Arrow, C, Dot, Handle, Plot, Seg, TextAt, usePlot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { easeInOut, fmt, randInt, tween } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { FOUND_GENS } from './gens_found';

type V2 = [number, number];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const dot = (a: V2, b: V2) => a[0] * b[0] + a[1] * b[1];
const len = (a: V2) => Math.hypot(a[0], a[1]);
const r1 = (v: number) => Math.round(v * 10) / 10;

function Poly({ pts, fill, stroke, opacity = 0.3, dashed }: { pts: V2[]; fill?: string; stroke?: string; opacity?: number; dashed?: boolean }) {
  const { sx, sy } = usePlot();
  return (
    <polygon
      points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')}
      style={{ fill: fill ?? 'none', fillOpacity: opacity, stroke: stroke ?? 'none' }}
      strokeWidth={2}
      strokeDasharray={dashed ? '6 5' : undefined}
    />
  );
}

/* ── 1. Vector playground ───────────────────────────────── */
function VectorPlayground() {
  const [u, setU] = useState<V2>([3, 1]);
  const [v, setV] = useState<V2>([1, 2.5]);
  const [mode, setMode] = useState('add');
  const s = add(u, v), d = sub(u, v);
  const cos = dot(u, v) / (len(u) * len(v) || 1);
  const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  const projK = dot(u, v) / (dot(u, u) || 1);
  const proj: V2 = [u[0] * projK, u[1] * projK];
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={mode} onChange={setMode} options={[{ value: 'add', label: '$u + v$' }, { value: 'sub', label: '$u - v$' }, { value: 'dot', label: 'dot & angle' }, { value: 'proj', label: 'projection' }]} />
        <Plot view={{ xMin: -5, xMax: 6, yMin: -4, yMax: 5 }} width={492} height={398} ariaLabel="Vector playground">
          {mode === 'add' && (
            <>
              <Poly pts={[[0, 0], u, s, v]} fill={C.area} opacity={0.12} stroke={C.muted} dashed />
              <Arrow x1={0} y1={0} x2={s[0]} y2={s[1]} color={C.good} />
              <TextAt x={s[0]} y={s[1]} dx={8} color={C.good}>u + v</TextAt>
            </>
          )}
          {mode === 'sub' && (
            <>
              <Arrow x1={v[0]} y1={v[1]} x2={u[0]} y2={u[1]} color={C.secant} />
              <Arrow x1={0} y1={0} x2={d[0]} y2={d[1]} color={C.secant} />
              <TextAt x={d[0]} y={d[1]} dx={8} color={C.secant}>u − v</TextAt>
            </>
          )}
          {mode === 'proj' && (
            <>
              <Seg x1={v[0]} y1={v[1]} x2={proj[0]} y2={proj[1]} color={C.muted} dashed />
              <Arrow x1={0} y1={0} x2={proj[0]} y2={proj[1]} color={C.good} width={4} />
              <TextAt x={proj[0]} y={proj[1]} dy={18} color={C.good}>proj of v on u</TextAt>
            </>
          )}
          <Arrow x1={0} y1={0} x2={u[0]} y2={u[1]} color={C.tangent} />
          <Arrow x1={0} y1={0} x2={v[0]} y2={v[1]} color={C.curve} />
          <TextAt x={u[0]} y={u[1]} dx={10} dy={-6} color={C.tangent}>u</TextAt>
          <TextAt x={v[0]} y={v[1]} dx={10} dy={-6} color={C.curve}>v</TextAt>
          <Handle x={u[0]} y={u[1]} onDrag={(x, y) => setU([r1(x), r1(y)])} color={C.tangent} r={7} />
          <Handle x={v[0]} y={v[1]} onDrag={(x, y) => setV([r1(x), r1(y)])} color={C.curve} r={7} />
        </Plot>
        <p className="plot-caption">Drag the tips of u (pink) and v (cyan)</p>
      </div>
      <div className="explore-side">
        <Tex block>{`\\mathbf u = \\begin{pmatrix}${fmt(u[0])}\\\\${fmt(u[1])}\\end{pmatrix},\\ \\mathbf v = \\begin{pmatrix}${fmt(v[0])}\\\\${fmt(v[1])}\\end{pmatrix}`}</Tex>
        {mode === 'add' && <Tex block>{`\\mathbf u + \\mathbf v = \\begin{pmatrix}${fmt(s[0])}\\\\${fmt(s[1])}\\end{pmatrix}`}</Tex>}
        {mode === 'sub' && <Tex block>{`\\mathbf u - \\mathbf v = \\begin{pmatrix}${fmt(d[0])}\\\\${fmt(d[1])}\\end{pmatrix},\\ \\ \\|\\mathbf u - \\mathbf v\\| = ${fmt(len(d))}`}</Tex>}
        {(mode === 'dot' || mode === 'proj') && <Tex block>{`\\mathbf u\\cdot\\mathbf v = ${fmt(u[0])}(${fmt(v[0])}) + ${fmt(u[1])}(${fmt(v[1])}) = ${fmt(dot(u, v))}`}</Tex>}
        <div className="stat-row">
          <Stat label="$\|u\|$" value={fmt(len(u))} />
          <Stat label="$\|v\|$" value={fmt(len(v))} />
          <Stat label="angle θ" value={`${fmt(ang, 1)}°`} tone={Math.abs(ang - 90) < 1 ? 'good' : undefined} />
          <Stat label="cos θ" value={fmt(cos, 3)} tone="accent" />
        </div>
        <Callout tone={mode === 'sub' ? 'info' : 'ai'} icon={mode === 'sub' ? '📏' : '🧠'}>
          <MathText>
            {mode === 'sub'
              ? '$\\|\\mathbf u - \\mathbf v\\|$ is the **distance** between two points. k-nearest-neighbours classifies data using exactly this.'
              : mode === 'proj'
                ? 'Projection = the shadow of $\\mathbf v$ on $\\mathbf u$: $\\frac{\\mathbf u\\cdot\\mathbf v}{\\mathbf u\\cdot\\mathbf u}\\mathbf u$. Least-squares regression is a projection.'
                : '$\\cos\\theta = \\frac{\\mathbf u\\cdot\\mathbf v}{\\|\\mathbf u\\|\\|\\mathbf v\\|}$ is **cosine similarity**: how search engines and ChatGPT-style embeddings compare meanings. Make the angle 90° and the dot product becomes 0.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Norms ───────────────────────────────────────────── */
function unitBall(p: number, n = 240): V2[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    const c = Math.cos(t), s = Math.sin(t);
    if (!isFinite(p)) {
      const m = Math.max(Math.abs(c), Math.abs(s));
      return [c / m, s / m] as V2;
    }
    return [Math.sign(c) * Math.abs(c) ** (2 / p), Math.sign(s) * Math.abs(s) ** (2 / p)] as V2;
  });
}

function NormExplorer() {
  const [x, setX] = useState<V2>([1.5, 1]);
  const [p, setP] = useState(3);
  const n1 = Math.abs(x[0]) + Math.abs(x[1]);
  const n2 = len(x);
  const ni = Math.max(Math.abs(x[0]), Math.abs(x[1]));
  const np = (Math.abs(x[0]) ** p + Math.abs(x[1]) ** p) ** (1 / p);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3, xMax: 3, yMin: -2.4, yMax: 2.4 }} width={472} height={374} ariaLabel="Unit balls of different norms">
          <Poly pts={unitBall(1)} stroke={C.tangent} />
          <Poly pts={unitBall(2)} stroke={C.curve} />
          <Poly pts={unitBall(Infinity)} stroke={C.secant} />
          <Poly pts={unitBall(p)} stroke={C.good} fill={C.good} opacity={0.08} dashed />
          <Seg x1={0} y1={0} x2={x[0]} y2={0} color={C.tangent} width={2} />
          <Seg x1={x[0]} y1={0} x2={x[0]} y2={x[1]} color={C.tangent} width={2} />
          <Seg x1={0} y1={0} x2={x[0]} y2={x[1]} color={C.curve} width={2} />
          <Handle x={x[0]} y={x[1]} onDrag={(a, b) => setX([r1(a), r1(b)])} color={C.text} r={7} />
        </Plot>
        <div className="legend-row">
          <span style={{ color: C.tangent }}>◆ ‖·‖₁ = 1</span>
          <span style={{ color: C.curve }}>● ‖·‖₂ = 1</span>
          <span style={{ color: C.secant }}>■ ‖·‖∞ = 1</span>
          <span style={{ color: C.good }}>┅ ‖·‖ₚ = 1</span>
        </div>
      </div>
      <div className="explore-side">
        <div className="stat-row">
          <Stat label="$\|x\|_1$ taxicab" value={fmt(n1)} />
          <Stat label="$\|x\|_2$ length" value={fmt(n2)} tone="accent" />
          <Stat label="$\|x\|_\infty$ max" value={fmt(ni)} tone="warn" />
        </div>
        <Slider label="$p$" value={p} min={1} max={12} step={0.1} onChange={setP} />
        <Stat label={`$\\|x\\|_{${fmt(p, 1)}}$`} value={fmt(np, 3)} tone="good" />
        <p className="muted small">
          <MathText>{'Each shape is the set of all points at "distance 1" from the origin. As $p$ grows the shape goes from diamond ($p=1$) through circle ($p=2$) to square ($p\\to\\infty$). Always $\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1$.'}</MathText>
        </p>
        <Callout tone="ai" icon="🧠">
          <MathText>{'Regularisation in ML adds $\\lambda\\|w\\|_1$ (Lasso, pushes weights to exactly 0, thanks to the diamond\'s corners) or $\\lambda\\|w\\|_2^2$ (Ridge, keeps weights small).'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Matrix as transformation ────────────────────────── */
const PRESETS: { key: string; label: string; m: [number, number, number, number] }[] = [
  { key: 'rot', label: 'Rotate 45°', m: [0.71, -0.71, 0.71, 0.71] },
  { key: 'scale', label: 'Stretch', m: [2, 0, 0, 0.5] },
  { key: 'shear', label: 'Shear', m: [1, 1, 0, 1] },
  { key: 'refl', label: 'Reflect', m: [1, 0, 0, -1] },
  { key: 'sing', label: 'Singular', m: [1, 2, 0.5, 1] },
];

function MatrixTransform() {
  const [m, setM] = useState<[number, number, number, number]>([1, 1, 0, 1]);
  const [t, setT] = useState(1);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);
  const [a, b, c, d] = m.map((v, i) => (1 - t) * (i === 0 || i === 3 ? 1 : 0) + t * v);
  const T = (p: V2): V2 => [a * p[0] + b * p[1], c * p[0] + d * p[1]];
  const det = m[0] * m[3] - m[1] * m[2];
  // norms of the full matrix
  const [A, B, Cc, D] = m;
  const n1 = Math.max(Math.abs(A) + Math.abs(Cc), Math.abs(B) + Math.abs(D));
  const ninf = Math.max(Math.abs(A) + Math.abs(B), Math.abs(Cc) + Math.abs(D));
  const fro = Math.hypot(A, B, Cc, D);
  const p = A * A + Cc * Cc, q = A * B + Cc * D, r = B * B + D * D;
  const lmax = (p + r) / 2 + Math.sqrt(((p - r) / 2) ** 2 + q * q);
  const n2 = Math.sqrt(lmax);
  const play = () => {
    setT(0);
    cancel.current = tween(1400, (k) => setT(easeInOut(k)));
  };
  const grid: [V2, V2][] = [];
  for (let k = -8; k <= 8; k++) {
    grid.push([[k, -8], [k, 8]]);
    grid.push([[-8, k], [8, k]]);
  }
  const circle = unitBall(2, 120).map(T);
  return (
    <div className="explore">
      <div className="explore-plot">
        <div className="btn-row" style={{ marginTop: 0 }}>
          {PRESETS.map((pr) => (
            <button key={pr.key} className="chip" onClick={() => { setM(pr.m); play(); }}>{pr.label}</button>
          ))}
        </div>
        <Plot view={{ xMin: -4, xMax: 4, yMin: -3, yMax: 3 }} width={532} height={398} ticks={false} ariaLabel="Linear transformation of the plane">
          {grid.map(([p1, p2], i) => {
            const P = T(p1), Q = T(p2);
            return <Seg key={i} x1={P[0]} y1={P[1]} x2={Q[0]} y2={Q[1]} color={C.axis} width={1} opacity={0.6} />;
          })}
          <Poly pts={[[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => T(p as V2))} fill={C.area} stroke={C.area} opacity={0.35} />
          <Poly pts={circle} stroke={C.secant} />
          <Arrow x1={0} y1={0} x2={a} y2={c} color={C.tangent} />
          <Arrow x1={0} y1={0} x2={b} y2={d} color={C.curve} />
          <Dot x={0} y={0} r={4} color={C.text} />
        </Plot>
        <p className="plot-caption">Purple = image of the unit square (area = |det|). Yellow = image of the unit circle.</p>
      </div>
      <div className="explore-side">
        <div className="matrix-sliders">
          {(['a', 'b', 'c', 'd'] as const).map((nm, i) => (
            <Slider key={nm} label={`$${nm}$`} value={m[i]} min={-2} max={2} step={0.05} onChange={(v) => { setT(1); setM(m.map((w, j) => (j === i ? v : w)) as [number, number, number, number]); }} />
          ))}
        </div>
        <Tex block>{`A = \\begin{pmatrix} ${fmt(m[0])} & ${fmt(m[1])} \\\\ ${fmt(m[2])} & ${fmt(m[3])} \\end{pmatrix}`}</Tex>
        <button className="btn btn-ghost" onClick={play}>▶ Animate from identity</button>
        <div className="stat-row">
          <Stat label="det" value={fmt(det, 3)} tone={Math.abs(det) < 1e-6 ? 'bad' : 'accent'} />
          <Stat label="$\|A\|_1$" value={fmt(n1)} />
          <Stat label="$\|A\|_\infty$" value={fmt(ninf)} />
          <Stat label="$\|A\|_F$" value={fmt(fro)} />
          <Stat label="$\|A\|_2$" value={fmt(n2)} tone="warn" />
        </div>
        <Callout tone={Math.abs(det) < 1e-6 ? 'warn' : 'info'} icon={Math.abs(det) < 1e-6 ? '🫓' : '🧭'}>
          <MathText>
            {Math.abs(det) < 1e-6
              ? '**det = 0**: the plane is squashed onto a line. Information is lost, so the matrix has **no inverse**.'
              : 'The columns of $A$ are where $\\mathbf e_1$ (pink) and $\\mathbf e_2$ (cyan) land. $\\|A\\|_2$ is the **largest stretch**: the long radius of the yellow ellipse.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 4. Matrix multiplication ───────────────────────────── */
const rnd = (r: number, c: number) => Array.from({ length: r }, () => Array.from({ length: c }, () => randInt(-3, 4)));

function MatMul() {
  const [A, setA] = useState(() => rnd(2, 3));
  const [B, setB] = useState(() => rnd(3, 2));
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const P = A.map((row) => B[0].map((_, j) => row.reduce((s, x, k) => s + x * B[k][j], 0)));
  const [i, j] = cell;
  return (
    <Card>
      <div className="matmul">
        <MatrixView m={A} label="A (2×3)" hiRows={[i]} />
        <span className="op">×</span>
        <MatrixView m={B} label="B (3×2)" hiCols={[j]} />
        <span className="op">=</span>
        <div className="matrix-wrap">
          <span className="matrix-label">AB (2×2): click a cell</span>
          <div className="matrix clickable-m" style={{ gridTemplateColumns: 'repeat(2, auto)' }}>
            {P.map((row, a) =>
              row.map((v, b) => (
                <motion.button key={`${a}${b}`} className={`mcell ${a === i && b === j ? 'hcell' : ''}`} onClick={() => setCell([a, b])} whileTap={{ scale: 0.9 }}>
                  {v}
                </motion.button>
              )),
            )}
          </div>
        </div>
      </div>
      <Tex block>{`(AB)_{${i + 1}${j + 1}} = ${A[i].map((a, k) => `(${a})(${B[k][j]})`).join(' + ')} = ${P[i][j]}`}</Tex>
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={() => { setA(rnd(2, 3)); setB(rnd(3, 2)); }}>🎲 New matrices</button>
      </div>
      <Callout tone="ai" icon="🧠">
        <MathText>{'Entry $(i, j)$ = row $i$ of $A$ **dot** column $j$ of $B$. A neural-network layer is exactly this: weights matrix × input vector.'}</MathText>
      </Callout>
    </Card>
  );
}

export default function Vectors() {
  return (
    <>
      <Section id="vectors" kicker="Vectors" title="Arrows with arithmetic" intro="A vector has a size and a direction. In AI every data point (an image, a word, a user) is a vector of numbers.">
        <VectorPlayground />
      </Section>

      <Section id="norms" kicker="Norms" title="Many ways to measure size" intro="A **norm** $\|x\|$ measures how big a vector is. Different norms give different answers, and different shapes.">
        <NormExplorer />
      </Section>

      <Section id="matrix" kicker="Matrices" title="A matrix moves space">
        <MatrixTransform />
      </Section>

      <Section id="matmul" kicker="Multiplication" title="Row times column">
        <MatMul />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Formulas">
        <div className="rules-grid">
          <RuleCard title="Dot product" tex="\mathbf u\cdot\mathbf v = \sum_i u_i v_i = \|\mathbf u\|\|\mathbf v\|\cos\theta" />
          <RuleCard title="Vector norms" tex="\|x\|_1 = \sum|x_i|,\ \|x\|_2 = \sqrt{\sum x_i^2}" note="$\|x\|_\infty = \max|x_i|$" />
          <RuleCard title="p-norm" tex="\|x\|_p = \Big(\sum |x_i|^p\Big)^{1/p}" />
          <RuleCard title="Matrix 1 and ∞ norms" tex="\|A\|_1 = \max_j \sum_i |a_{ij}|" note="max column sum; $\|A\|_\infty$ = max row sum" />
          <RuleCard title="Frobenius" tex="\|A\|_F = \sqrt{\textstyle\sum_{i,j} a_{ij}^2}" />
          <RuleCard title="Product sizes" tex="(m\times n)(n\times p) = m\times p" note="inner sizes must match; $AB \neq BA$ in general" />
          <RuleCard title="2×2 determinant" tex="\det\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad - bc" />
          <RuleCard title="2×2 inverse" tex="A^{-1} = \frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}" />
        </div>
      </Section>

      <MatlabSection topic="vectors" />

      <Section id="practice" kicker="Practice" title="Vector & matrix drills">
        <Quiz id="w3-vec-quiz" title="Vectors & Matrices Drills" blurb="Dot products, vector norms, matrix products, determinants, matrix norms and sizes." gens={FOUND_GENS.vectors} />
      </Section>
    </>
  );
}
