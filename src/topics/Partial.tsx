import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Field, FieldArrow } from '../components/Field';
import { C, Curve, Dot, Plot, SlopeLine } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { deriv, fmt } from '../lib/math';
import { addXp, recordBest } from '../lib/progress';
import { ALL_GENS } from './gens';

/* ── 1. Chain-rule machine ───────────────────────────────── */
type Chain = { key: string; label: string; y: string; inner: string; outer: string; g: (x: number) => number; dg: (x: number) => number; f: (u: number) => number; df: (u: number) => number; dgTex: string; dfTex: string };
const sig = (u: number) => 1 / (1 + Math.exp(-u));
const CHAINS: Chain[] = [
  { key: 'sq', label: '$(3x+1)^2$', y: '(3x+1)^2', inner: 'u = 3x + 1', outer: 'y = u^2', g: (x) => 3 * x + 1, dg: () => 3, f: (u) => u * u, df: (u) => 2 * u, dgTex: '3', dfTex: '2u' },
  { key: 'sin', label: '$\\sin(x^2)$', y: '\\sin(x^2)', inner: 'u = x^2', outer: 'y = \\sin u', g: (x) => x * x, dg: (x) => 2 * x, f: Math.sin, df: Math.cos, dgTex: '2x', dfTex: '\\cos u' },
  { key: 'exp', label: '$e^{2x}$', y: 'e^{2x}', inner: 'u = 2x', outer: 'y = e^{u}', g: (x) => 2 * x, dg: () => 2, f: Math.exp, df: Math.exp, dgTex: '2', dfTex: 'e^{u}' },
  { key: 'sig', label: 'neuron $\\sigma(2x-1)$', y: '\\sigma(2x-1)', inner: 'u = 2x - 1', outer: 'y = \\sigma(u)', g: (x) => 2 * x - 1, dg: () => 2, f: sig, df: (u) => sig(u) * (1 - sig(u)), dgTex: '2', dfTex: '\\sigma(u)(1-\\sigma(u))' },
];

function Bar({ v, max, color }: { v: number; max: number; color: string }) {
  const w = Math.min(100, (Math.abs(v) / max) * 100);
  return (
    <div className="bar-track">
      <motion.div className="bar-fill" style={{ background: color }} animate={{ width: `${w}%` }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} />
    </div>
  );
}

function ChainMachine() {
  const [ck, setCk] = useState('sin');
  const ch = CHAINS.find((c) => c.key === ck)!;
  const [x, setX] = useState(1);
  const [pulse, setPulse] = useState(0);
  const u = ch.g(x);
  const gp = ch.dg(x);
  const fp = ch.df(u);
  const total = fp * gp;
  const dx = 0.1;
  const du = gp * dx;
  const dy = fp * du;
  const maxBar = Math.max(Math.abs(dx), Math.abs(du), Math.abs(dy), 0.05);
  const check = deriv((t) => ch.f(ch.g(t)), x);

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={ck} onChange={setCk} options={CHAINS.map((c) => ({ value: c.key, label: c.label }))} />
        <div className="machine">
          {[
            { lbl: 'input', val: `x = ${fmt(x)}`, kind: 'io' },
            { lbl: 'inner', val: ch.inner, kind: 'box', mult: `\\times\\, ${fmt(gp)}` },
            { lbl: 'middle', val: `u = ${fmt(u)}`, kind: 'io' },
            { lbl: 'outer', val: ch.outer, kind: 'box', mult: `\\times\\, ${fmt(fp)}` },
            { lbl: 'output', val: `y = ${fmt(ch.f(u))}`, kind: 'io' },
          ].map((n, i) => (
            <motion.div
              key={`${ck}-${i}`}
              className={`machine-node ${n.kind}`}
              animate={pulse ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 28px rgba(124,92,255,.7)', '0 0 0 rgba(0,0,0,0)'] } : {}}
              transition={{ delay: i * 0.18, duration: 0.5 }}
            >
              <small>{n.lbl}</small>
              <Tex>{n.val}</Tex>
              {n.mult && <span className="machine-mult"><Tex>{n.mult}</Tex></span>}
            </motion.div>
          ))}
          <div className="machine-flow" key={pulse} />
        </div>
        <div className="wiggle">
          <div className="wiggle-row"><span className="mono">Δx</span><Bar v={dx} max={maxBar} color={C.curve} /><span className="mono">{fmt(dx, 3)}</span></div>
          <div className="wiggle-row"><span className="mono">Δu</span><Bar v={du} max={maxBar} color={C.curve2} /><span className="mono">{fmt(du, 3)}</span></div>
          <div className="wiggle-row"><span className="mono">Δy</span><Bar v={dy} max={maxBar} color={C.tangent} /><span className="mono">{fmt(dy, 3)}</span></div>
        </div>
        <p className="plot-caption">A small nudge Δx gets multiplied by each box's derivative as it flows through</p>
      </div>
      <div className="explore-side">
        <Slider label="$x$" value={x} min={-2} max={2} step={0.01} onChange={setX} />
        <button className="btn btn-primary" onClick={() => setPulse((p) => p + 1)}>Send a wiggle through ⚡</button>
        <Tex block>{`\\frac{dy}{dx} = \\underbrace{${ch.dfTex}}_{f'(u)}\\cdot\\underbrace{${ch.dgTex}}_{g'(x)} = ${fmt(fp, 3)}\\times ${fmt(gp, 3)} = ${fmt(total, 3)}`}</Tex>
        <div className="stat-row">
          <Stat label="Chain rule" value={fmt(total, 4)} tone="accent" />
          <Stat label="Numerical check" value={fmt(check, 4)} tone="good" />
        </div>
        <Callout tone="ai" icon="🧠">
          <MathText>**Backpropagation** in neural networks is *exactly* this machine with hundreds of boxes: multiply the local derivatives backwards through every layer.</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Partial derivative explorer ───────────────────────── */
type Surf = { key: string; label: string; tex: string; f: (x: number, y: number) => number; fx: (x: number, y: number) => number; fy: (x: number, y: number) => number; fxTex: string; fyTex: string };
const SURFS: Surf[] = [
  { key: 'bowl', label: 'Bowl', tex: 'x^2 + y^2', f: (x, y) => x * x + y * y, fx: (x) => 2 * x, fy: (_, y) => 2 * y, fxTex: '2x', fyTex: '2y' },
  { key: 'saddle', label: 'Saddle', tex: 'x^2 - y^2', f: (x, y) => x * x - y * y, fx: (x) => 2 * x, fy: (_, y) => -2 * y, fxTex: '2x', fyTex: '-2y' },
  { key: 'mixed', label: 'Mixed', tex: 'x^2y', f: (x, y) => x * x * y, fx: (x, y) => 2 * x * y, fy: (x) => x * x, fxTex: '2xy', fyTex: 'x^2' },
  { key: 'hill', label: 'Hill', tex: '4e^{-(x^2+y^2)/4}', f: (x, y) => 4 * Math.exp(-(x * x + y * y) / 4), fx: (x, y) => -0.5 * x * 4 * Math.exp(-(x * x + y * y) / 4), fy: (x, y) => -0.5 * y * 4 * Math.exp(-(x * x + y * y) / 4), fxTex: '-\\tfrac{x}{2}f', fyTex: '-\\tfrac{y}{2}f' },
];

function PartialExplorer() {
  const [sk, setSk] = useState('bowl');
  const S = SURFS.find((s) => s.key === sk)!;
  const [p, setP] = useState({ x: 1.2, y: -0.8 });
  const view = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
  const fx = S.fx(p.x, p.y);
  const fy = S.fy(p.x, p.y);
  const sliceX = (t: number) => S.f(t, p.y);
  const sliceY = (t: number) => S.f(p.x, t);
  const yr = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (let i = -30; i <= 30; i++)
      for (let j = -30; j <= 30; j++) {
        const v = S.f(i / 10, j / 10);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    const pad = (hi - lo) * 0.1;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [S]);
  const scale = 0.35;

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={sk} onChange={setSk} options={SURFS.map((s) => ({ value: s.key, label: s.label }))} />
        <Field f={S.f} view={view} onScrub={(x, y) => setP({ x, y })} ariaLabel="Heatmap of f(x,y)">
          {({ X, Y, size }) => (
            <>
              <line x1={0} x2={size} y1={Y(p.y)} y2={Y(p.y)} stroke={C.curve} strokeWidth={2} strokeDasharray="6 5" />
              <line y1={0} y2={size} x1={X(p.x)} x2={X(p.x)} stroke={C.curve2} strokeWidth={2} strokeDasharray="6 5" />
              <FieldArrow x1={X(p.x)} y1={Y(p.y)} x2={X(p.x + fx * scale)} y2={Y(p.y + fy * scale)} color={C.secant} width={3.5} />
              <circle cx={X(p.x)} cy={Y(p.y)} r={8} fill={C.tangent} stroke={C.bg} strokeWidth={2} />
            </>
          )}
        </Field>
        <p className="plot-caption">Bright = high, dark = low. Drag the point around. Yellow arrow = gradient ∇f (points uphill).</p>
      </div>
      <div className="explore-side">
        <Tex block>{`f(x,y) = ${S.tex}`}</Tex>
        <div className="mini-plots">
          <div>
            <span className="mini-label" style={{ color: C.curve }}>
              <MathText>{`Slice along $x$ (y fixed at ${fmt(p.y)})`}</MathText>
            </span>
            <Plot view={{ xMin: -3, xMax: 3, ...yr }} height={160} width={360} ticks={false} ariaLabel="Slice along x">
              <Curve f={sliceX} color={C.curve} />
              <SlopeLine x0={p.x} y0={S.f(p.x, p.y)} m={fx} color={C.secant} width={2} />
              <Dot x={p.x} y={S.f(p.x, p.y)} />
            </Plot>
          </div>
          <div>
            <span className="mini-label" style={{ color: C.curve2 }}>
              <MathText>{`Slice along $y$ (x fixed at ${fmt(p.x)})`}</MathText>
            </span>
            <Plot view={{ xMin: -3, xMax: 3, ...yr }} height={160} width={360} ticks={false} xLabel="y" ariaLabel="Slice along y">
              <Curve f={sliceY} color={C.curve2} />
              <SlopeLine x0={p.y} y0={S.f(p.x, p.y)} m={fy} color={C.secant} width={2} />
              <Dot x={p.y} y={S.f(p.x, p.y)} />
            </Plot>
          </div>
        </div>
        <Tex block>{`\\frac{\\partial f}{\\partial x} = ${S.fxTex} = ${fmt(fx)},\\quad \\frac{\\partial f}{\\partial y} = ${S.fyTex} = ${fmt(fy)}`}</Tex>
        <Tex block>{`\\nabla f = \\begin{pmatrix} ${fmt(fx)} \\\\ ${fmt(fy)} \\end{pmatrix}`}</Tex>
      </div>
    </div>
  );
}

/* ── 3. Game: Summit in the Fog ───────────────────────────── */
const FV = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
const STEP_R = 1.6;
const REVEAL_R = 0.95;
const MAX_MOVES = 12;

function makeTerrain() {
  const ang = Math.random() * Math.PI * 2;
  const px = Math.round(2.6 * Math.cos(ang) * 10) / 10, py = Math.round(2.6 * Math.sin(ang) * 10) / 10;
  const dx = -px * 0.9 + (Math.random() - 0.5), dy = -py * 0.9 + (Math.random() - 0.5);
  const f = (x: number, y: number) =>
    5 * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / 6) + 2.6 * Math.exp(-((x - dx) ** 2 + (y - dy) ** 2) / 2.2) + 0.15 * Math.sin(x * 1.3) * Math.cos(y * 1.1);
  let bx = px, by = py, bv = -Infinity;
  for (let i = -100; i <= 100; i++)
    for (let j = -100; j <= 100; j++) {
      const v = f(i / 20, j / 20);
      if (v > bv) [bx, by, bv] = [i / 20, j / 20, v];
    }
  const sx = -px * 1.6 + (Math.random() - 0.5) * 1.5;
  const sy = -py * 1.6 + (Math.random() - 0.5) * 1.5;
  return { f, peak: { x: bx, y: by }, start: { x: Math.max(-4.6, Math.min(4.6, sx)), y: Math.max(-4.6, Math.min(4.6, sy)) } };
}

function SummitFog() {
  const [T, setT] = useState(makeTerrain);
  const [path, setPath] = useState(() => [T.start]);
  const [over, setOver] = useState<null | 'won' | 'lost'>(null);
  const cur = path[path.length - 1];
  const h = 1e-4;
  const gx = (T.f(cur.x + h, cur.y) - T.f(cur.x - h, cur.y)) / (2 * h);
  const gy = (T.f(cur.x, cur.y + h) - T.f(cur.x, cur.y - h)) / (2 * h);
  const moves = path.length - 1;
  const stars = moves <= 5 ? 3 : moves <= 8 ? 2 : 1;

  const restart = () => {
    const nt = makeTerrain();
    setT(nt);
    setPath([nt.start]);
    setOver(null);
  };

  const go = (x: number, y: number) => {
    if (over) return;
    let dx = x - cur.x, dy = y - cur.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.05) return;
    if (d > STEP_R) [dx, dy] = [(dx / d) * STEP_R, (dy / d) * STEP_R];
    const np = { x: Math.max(-5, Math.min(5, cur.x + dx)), y: Math.max(-5, Math.min(5, cur.y + dy)) };
    const nextPath = [...path, np];
    setPath(nextPath);
    if (Math.hypot(np.x - T.peak.x, np.y - T.peak.y) < 0.5) {
      const m = nextPath.length - 1;
      const s = m <= 5 ? 3 : m <= 8 ? 2 : 1;
      recordBest('w9-fog', s / 3);
      addXp(15 * s);
      setOver('won');
    } else if (nextPath.length - 1 >= MAX_MOVES) setOver('lost');
  };
  const mag = Math.hypot(gx, gy);
  const arrowLen = mag > 1e-6 ? 1.3 : 0;

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game</span>
          <h3>Summit in the Fog</h3>
          <p className="muted">
            <MathText>{`You can't see the mountain, only the **partial derivatives** where you stand. Click to step (max ${STEP_R} units). Reach the true summit in as few moves as you can. Beware the smaller decoy hill!`}</MathText>
          </p>
        </div>
        <div className="game-score mono">
          <span>Moves {moves}/{MAX_MOVES}</span>
          <strong>Height {fmt(T.f(cur.x, cur.y), 2)}</strong>
        </div>
      </div>
      <div className="explore">
        <div className="explore-plot">
          <Field f={T.f} view={FV} onClickPoint={go} ariaLabel="Foggy terrain map">
            {({ X, Y, size }) => {
              const k = size / 10;
              return (
                <>
                  <defs>
                    <radialGradient id="fogHole">
                      <stop offset="0%" stopColor="black" stopOpacity="1" />
                      <stop offset="65%" stopColor="black" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="black" stopOpacity="0" />
                    </radialGradient>
                    <mask id="fogMask">
                      <rect width={size} height={size} fill="white" />
                      {path.map((p, i) => (
                        <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={REVEAL_R * k} fill="url(#fogHole)" />
                      ))}
                    </mask>
                  </defs>
                  <AnimatePresence>
                    {!over && (
                      <motion.rect key="fog" width={size} height={size} fill="#06070f" mask="url(#fogMask)" initial={{ opacity: 0.97 }} animate={{ opacity: 0.97 }} exit={{ opacity: 0, transition: { duration: 1.2 } }} />
                    )}
                  </AnimatePresence>
                  {!over && <circle cx={X(cur.x)} cy={Y(cur.y)} r={STEP_R * k} fill="none" stroke="rgba(255,255,255,.25)" strokeDasharray="4 6" />}
                  <polyline points={path.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke={C.text} strokeWidth={2} strokeDasharray="2 5" />
                  {!over && arrowLen > 0 && (
                    <FieldArrow x1={X(cur.x)} y1={Y(cur.y)} x2={X(cur.x + (gx / mag) * arrowLen)} y2={Y(cur.y + (gy / mag) * arrowLen)} color={C.secant} width={3.5} />
                  )}
                  {over && <text x={X(T.peak.x)} y={Y(T.peak.y) + 8} textAnchor="middle" fontSize={24}>🚩</text>}
                  <circle cx={X(cur.x)} cy={Y(cur.y)} r={8} fill={C.tangent} stroke={C.bg} strokeWidth={2} />
                </>
              );
            }}
          </Field>
          <p className="plot-caption">Click inside the dashed circle to move · yellow arrow = direction of ∇f</p>
        </div>
        <div className="explore-side">
          <div className="stat-row">
            <Stat label="$\partial f/\partial x$" value={fmt(gx, 3)} tone={gx > 0 ? 'good' : 'bad'} />
            <Stat label="$\partial f/\partial y$" value={fmt(gy, 3)} tone={gy > 0 ? 'good' : 'bad'} />
          </div>
          <Stat label="steepness $|\nabla f|$" value={fmt(mag, 3)} />
          <p className="muted small">
            <MathText>{`$\\partial f/\\partial x > 0$ means "east is uphill", $\\partial f/\\partial y > 0$ means "north is uphill". When both are near 0 you're on a flat spot: a peak… or the decoy.`}</MathText>
          </p>
          {over && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`feedback ${over === 'won' ? 'good' : 'bad'}`}>
              {over === 'won' && <Confetti count={50} />}
              <strong>{over === 'won' ? `Summit reached in ${moves} moves! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : 'Out of moves. The fog lifts…'}</strong>
              <div className="muted">
                {over === 'won' ? 'That is gradient ascent. Flip the sign and it is gradient descent, the engine of every neural network.' : 'See the map now? Follow the arrow and take bigger steps when the slope is gentle.'}
              </div>
              <button className="btn btn-primary" onClick={restart}>New mountain</button>
            </motion.div>
          )}
          {!over && (
            <button className="btn btn-ghost" onClick={restart}>
              New mountain
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Partial() {
  return (
    <>
      <Section id="chain" kicker="Further differentiation" title="The chain rule machine" intro="A function inside a function: $y = f(g(x))$. A nudge in $x$ is amplified by the inner box, then again by the outer box. **Multiply the rates.**">
        <ChainMachine />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Product, quotient & chain">
        <div className="rules-grid">
          <RuleCard title="Chain rule" tex="\frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx}" note="Outside derivative × inside derivative" />
          <RuleCard title="Product rule" tex="(uv)' = u'v + uv'" note="NOT $u' \cdot v'$!" />
          <RuleCard title="Quotient rule" tex="\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}" note="Low d-high minus high d-low, over low squared" />
          <RuleCard title="Sigmoid (AI favourite)" tex="\sigma'(x) = \sigma(x)\,(1-\sigma(x))" />
        </div>
      </Section>

      <Section id="partial" kicker="Many variables" title="Partial derivatives" intro="AI models have millions of inputs. A **partial derivative** asks: if I wiggle just ONE variable and freeze the rest, how fast does $f$ change? Slice the surface and it's just ordinary differentiation.">
        <PartialExplorer />
        <Callout tone="info" icon="✂️">
          <MathText>{`**How to compute** $\\frac{\\partial f}{\\partial x}$: pretend $y$ is just a number like 7, then differentiate normally. For $f = x^2y$: $\\frac{\\partial f}{\\partial x} = 2xy$ (y rides along as a constant), $\\frac{\\partial f}{\\partial y} = x^2$ (like $\\frac{d}{dy}(7y) = 7$).`}</MathText>
        </Callout>
      </Section>

      <Section id="play" kicker="Play" title="Climb using only the gradient" intro="The gradient $\nabla f = \left(\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}\right)$ always points in the steepest uphill direction.">
        <SummitFog />
      </Section>

      <Section id="practice" kicker="Practice" title="Chain, product & partial drills">
        <Quiz id="w9-quiz" title="Chain & Partial Drills" blurb="Chain rule, product rule, partial derivatives and gradients at a point." gens={ALL_GENS.partial} />
      </Section>
    </>
  );
}
