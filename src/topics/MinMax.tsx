import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaFill, Arrow, C, Curve, Dot, Plot, Seg, SlopeLine, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Slider, Stat } from '../components/UI';
import { clamp, deriv, fmt, lerp, polyTex, quadRoots, tween, type Fn, type View } from '../lib/math';
import { addXp, recordBest, useProgress } from '../lib/progress';
import { MatlabSection } from '../matlab/MatlabSection';
import { ALL_GENS } from './gens';

/* ── 1. Stationary point explorer ────────────────────────── */
function StationaryExplorer() {
  const [a, setA] = useState(0.5);
  const [b, setB] = useState(0);
  const [c, setC] = useState(-2);
  const [d, setD] = useState(0);
  const [x, setX] = useState(-2.5);
  const f: Fn = (t) => a * t ** 3 + b * t ** 2 + c * t + d;
  const fp: Fn = (t) => 3 * a * t ** 2 + 2 * b * t + c;
  const fpp: Fn = (t) => 6 * a * t + 2 * b;
  const view: View = { xMin: -4, xMax: 4, yMin: -8, yMax: 8 };

  const stationary = quadRoots(3 * a, 2 * b, c)
    .filter((r) => r > -4 && r < 4)
    .map((r) => {
      const s = fpp(r);
      const kind = s > 1e-6 ? 'min' : s < -1e-6 ? 'max' : 'inflection';
      return { x: r, y: f(r), s, kind };
    });
  const bounds = [-4, ...stationary.map((s) => s.x), 4];
  const intervals = bounds.slice(0, -1).map((lo, i) => ({ lo, hi: bounds[i + 1], up: fp((lo + bounds[i + 1]) / 2) > 0 }));
  const colorOf = (k: string) => (k === 'min' ? C.good : k === 'max' ? C.bad : C.secant);

  return (
    <div className="explore">
      <div className="explore-plot stacked">
        <Plot view={view} height={270} onScrub={(nx) => setX(nx)} yLabel="f(x)" ariaLabel="Cubic with stationary points">
          <Curve f={f} />
          <SlopeLine x0={x} y0={f(x)} m={fp(x)} color={C.tangent} width={2} />
          <Dot x={x} y={f(x)} r={6} />
          {stationary.map((s) => (
            <g key={s.x}>
              <Dot x={s.x} y={s.y} r={9} color={colorOf(s.kind)} />
              <TextAt x={s.x} y={s.y} dy={s.kind === 'max' ? -16 : 26} anchor="middle" color={colorOf(s.kind)}>
                {s.kind}
              </TextAt>
            </g>
          ))}
        </Plot>
        <Plot view={view} height={200} onScrub={(nx) => setX(nx)} yLabel="f′(x)" ariaLabel="Derivative with sign shading">
          <AreaFill f={(t) => Math.max(0, fp(t))} from={-4} to={4} color={C.good} opacity={0.22} />
          <AreaFill f={(t) => Math.min(0, fp(t))} from={-4} to={4} color={C.bad} opacity={0.22} />
          <Curve f={fp} color={C.curve2} />
          {stationary.map((s) => (
            <Dot key={s.x} x={s.x} y={0} r={7} color={colorOf(s.kind)} />
          ))}
          <Seg x1={x} y1={-8} x2={x} y2={8} color={C.muted} dashed opacity={0.5} />
          <Dot x={x} y={fp(x)} r={5} color={C.tangent} />
        </Plot>
      </div>
      <div className="explore-side">
        <Tex block>{`f(x) = ${polyTex([[+a.toFixed(2), 3], [+b.toFixed(2), 2], [+c.toFixed(2), 1], [+d.toFixed(2), 0]])}`}</Tex>
        <Slider label="$a$ (x³)" value={a} min={-1} max={1} step={0.05} onChange={setA} />
        <Slider label="$b$ (x²)" value={b} min={-2} max={2} step={0.1} onChange={setB} />
        <Slider label="$c$ (x)" value={c} min={-4} max={4} step={0.1} onChange={setC} />
        <Slider label="$d$ (const)" value={d} min={-4} max={4} step={0.1} onChange={setD} />
        <div className="sign-chart" aria-label="Sign of f prime">
          {intervals.map((iv, i) => (
            <div key={i} className={`sign-cell ${iv.up ? 'up' : 'down'}`} style={{ flex: Math.max(0.6, iv.hi - iv.lo) }}>
              <span>{iv.up ? '↗' : '↘'}</span>
              <small>f′ {iv.up ? '+' : '−'}</small>
            </div>
          ))}
        </div>
        {stationary.length === 0 ? (
          <Callout tone="warn" icon="🫥">
            <MathText>No stationary points: $f'(x) = 0$ has no real solutions, so the curve never levels off.</MathText>
          </Callout>
        ) : (
          <ul className="stationary-list">
            {stationary.map((s) => (
              <li key={s.x} style={{ borderColor: colorOf(s.kind) }}>
                <MathText>{`$x = ${fmt(s.x)}$: $f'' = ${fmt(s.s)}$ ${s.kind === 'min' ? '> 0 → **minimum** ∪' : s.kind === 'max' ? '< 0 → **maximum** ∩' : '= 0 → **inconclusive**'}`}</MathText>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── 2. Game: Gradient Descent Golf ─────────────────────── */
type Level = { name: string; f: Fn; start: number; steps: number; view: View; tip: string; par: number };
const LEVELS: Level[] = [
  { name: 'The Bowl', f: (x) => 0.5 * (x - 1.5) ** 2 + 0.5, start: -3, steps: 6, par: 1, view: { xMin: -4, xMax: 5, yMin: -1, yMax: 12 }, tip: 'There is a learning rate that sinks it in ONE step. Hint: here $L\'(x) = x - 1.5$.' },
  { name: 'Steep Valley', f: (x) => 2 * (x - 0.5) ** 2, start: 3, steps: 5, par: 1, view: { xMin: -3, xMax: 4, yMin: -1, yMax: 14 }, tip: 'Steep walls punish big steps. Try $\\alpha = 0.6$ and watch it explode, then find the sweet spot.' },
  { name: 'Local Trap', f: (x) => 0.1 * x ** 4 - x ** 2 + 0.6 * x + 3, start: 3.6, steps: 6, par: 2, view: { xMin: -4, xMax: 4, yMin: -2, yMax: 16 }, tip: 'Small steps slide you into the shallow dip on the right. The real minimum is on the left…' },
  { name: 'Bumpy Loss', f: (x) => 0.12 * (x - 1) ** 2 + 0.6 * Math.sin(2.2 * x) + 1.5, start: -3.5, steps: 8, par: 3, view: { xMin: -4, xMax: 5, yMin: -0.5, yMax: 5 }, tip: 'Real loss surfaces are bumpy. Mix big and small steps; change α between shots!' },
];

function globalMin(L: Level) {
  let bx = L.view.xMin, by = Infinity;
  for (let i = 0; i <= 4000; i++) {
    const x = lerp(L.view.xMin, L.view.xMax, i / 4000);
    const y = L.f(x);
    if (y < by) [bx, by] = [x, y];
  }
  return bx;
}

function DescentGolf() {
  const { best } = useProgress();
  const [li, setLi] = useState(0);
  const L = LEVELS[li];
  const target = useMemo(() => globalMin(L), [L]);
  const [x, setX] = useState(L.start);
  const [ball, setBall] = useState({ x: L.start, y: L.f(L.start) });
  const [alpha, setAlpha] = useState(0.1);
  const [hist, setHist] = useState<number[]>([]);
  const [state, setState] = useState<'play' | 'moving' | 'won' | 'lost' | 'flew'>('play');
  const [lastStep, setLastStep] = useState<{ x0: number; g: number; x1: number } | null>(null);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);

  const reset = (idx = li) => {
    cancel.current();
    const lv = LEVELS[idx];
    setLi(idx);
    setX(lv.start);
    setBall({ x: lv.start, y: lv.f(lv.start) });
    setHist([]);
    setState('play');
    setLastStep(null);
  };

  const used = hist.length;
  const stepsLeft = L.steps - used;
  const stars = used <= L.par ? 3 : used <= L.par + 2 ? 2 : 1;
  const tol = 0.15;

  const step = () => {
    if (state !== 'play') return;
    const g = deriv(L.f, x);
    const x1 = x - alpha * g;
    setLastStep({ x0: x, g, x1 });
    const span = L.view.yMax - L.view.yMin;
    const flies = x1 < L.view.xMin - 0.5 || x1 > L.view.xMax + 0.5 || !isFinite(x1);
    const xEnd = flies ? clamp(x1, L.view.xMin - 3, L.view.xMax + 3) : x1;
    const y0 = L.f(x);
    const yEnd = flies ? L.view.yMax + span * 0.5 : L.f(xEnd);
    const arc = span * 0.12 * Math.min(1, Math.abs(xEnd - x) / 1.5) + 0.05 * span;
    setState('moving');
    const nh = [...hist, x];
    setHist(nh);
    cancel.current = tween(
      650,
      (t) => setBall({ x: lerp(x, xEnd, t), y: lerp(y0, yEnd, t) + arc * Math.sin(Math.PI * t) * (flies ? 2 : 1) }),
      () => {
        setX(x1);
        if (flies) return setState('flew');
        if (Math.abs(x1 - target) < tol) {
          const s = nh.length <= L.par ? 3 : nh.length <= L.par + 2 ? 2 : 1;
          recordBest(`w8-golf-${li}`, s / 3);
          addXp(15 * s);
          return setState('won');
        }
        if (nh.length >= L.steps) return setState('lost');
        setState('play');
      },
    );
  };

  const g = deriv(L.f, x);
  const preview = x - alpha * g;

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game · this is how AI learns</span>
          <h3>Gradient Descent Golf</h3>
          <p className="muted">
            <MathText>{"Each shot moves the ball by $x_{\\text{new}} = x - \\alpha\\,L'(x)$. You only choose the learning rate $\\alpha$. Sink it in the global minimum ⛳ before you run out of shots."}</MathText>
          </p>
        </div>
        <div className="level-picker">
          {LEVELS.map((lv, i) => {
            const s = best[`w8-golf-${i}`];
            return (
              <button key={lv.name} className={`chip ${i === li ? 'active' : ''}`} onClick={() => reset(i)}>
                {i + 1}. {lv.name} <span className="stars">{s ? '★'.repeat(Math.round(s * 3)) : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="explore">
        <div className="explore-plot">
          <Plot view={L.view} height={340} yLabel="L(x)" ariaLabel="Gradient descent golf course">
            <AreaFill f={L.f} g={() => L.view.yMin} from={L.view.xMin} to={L.view.xMax} color={C.area} opacity={0.12} />
            <Curve f={L.f} />
            <Seg x1={target} y1={L.f(target)} x2={target} y2={L.f(target) + (L.view.yMax - L.view.yMin) * 0.14} color={C.text} width={2} />
            <TextAt x={target} y={L.f(target) + (L.view.yMax - L.view.yMin) * 0.14} dx={2} dy={4} size={18}>⛳</TextAt>
            {hist.map((h, i) => (
              <Dot key={i} x={h} y={L.f(h)} r={4} color={C.muted} stroke="none" opacity={0.6} />
            ))}
            {state === 'play' && (
              <>
                <SlopeLine x0={x} y0={L.f(x)} m={g} color={C.tangent} width={1.5} dashed />
                <Arrow x1={x} y1={L.f(x)} x2={clamp(preview, L.view.xMin - 1, L.view.xMax + 1)} y2={L.f(x)} color={C.secant} width={2.5} />
              </>
            )}
            <Dot x={ball.x} y={ball.y} r={10} color={state === 'won' ? C.good : C.tangent} />
          </Plot>
          <p className="plot-caption">Yellow arrow = where this α will send you. Pink dashed = the slope the gradient sees.</p>
        </div>
        <div className="explore-side">
          <Slider label="Learning rate $\alpha$" value={alpha} min={0.01} max={1.5} step={0.01} onChange={setAlpha} />
          <div className="stat-row">
            <Stat label="$x$" value={fmt(x, 3)} />
            <Stat label="$L'(x)$" value={fmt(g, 3)} tone={g > 0 ? 'bad' : 'good'} />
            <Stat label="Shots left" value={`${stepsLeft}`} tone={stepsLeft <= 1 ? 'warn' : undefined} />
          </div>
          {lastStep && (
            <Tex block>{`x \\leftarrow ${fmt(lastStep.x0, 2)} - ${fmt(alpha, 2)}\\times(${fmt(lastStep.g, 2)}) = ${fmt(lastStep.x1, 2)}`}</Tex>
          )}
          {state === 'play' || state === 'moving' ? (
            <button className="btn btn-primary btn-lg" onClick={step} disabled={state === 'moving'}>
              ⛳ Take a step
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`feedback ${state === 'won' ? 'good' : 'bad'}`}>
              {state === 'won' && <Confetti count={50} />}
              <strong>
                {state === 'won' ? `In the hole in ${used}! ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : state === 'flew' ? '🚀 Diverged! The ball flew off the course.' : '😵 Out of shots.'}
              </strong>
              <div className="muted">
                {state === 'won'
                  ? used <= L.par
                    ? 'Par or better. That is a well-tuned learning rate.'
                    : `Par is ${L.par}. Can you find a better α?`
                  : state === 'flew'
                    ? 'α was too large: each step overshot further than the last. Real neural nets do exactly this when the learning rate is too high (the loss becomes NaN).'
                    : 'Either α was too small (crawling), or you got stuck in a local minimum.'}
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => reset()}>Retry</button>
                {state === 'won' && li + 1 < LEVELS.length && (
                  <button className="btn btn-ghost" onClick={() => reset(li + 1)}>Next hole →</button>
                )}
              </div>
            </motion.div>
          )}
          <Callout tone="ai" icon="🧠">
            <MathText>{L.tip}</MathText>
          </Callout>
        </div>
      </div>
    </Card>
  );
}

export default function MinMax() {
  return (
    <>
      <Section id="explore" kicker="The big idea" title="Where the slope is zero" intro="At the top of a hill or the bottom of a valley the tangent is **flat**, so $f'(x) = 0$. Those are the **stationary points**. Change the cubic and watch them appear, merge and vanish.">
        <StationaryExplorer />
      </Section>

      <Section id="method" kicker="Recipe" title="Finding & classifying stationary points" intro="This is the exam procedure. Four steps, every time.">
        <div className="steps-grid">
          {[
            ['1', 'Differentiate', "Find $f'(x)$."],
            ['2', 'Set to zero', "Solve $f'(x) = 0$ for $x$. These are the stationary points."],
            ['3', 'Second derivative', "Find $f''(x)$ and plug each point in."],
            ['4', 'Classify', "$f''>0$ → min ∪, $f''<0$ → max ∩, $f''=0$ → check signs of $f'$ either side."],
          ].map(([n, t, body]) => (
            <motion.div key={n} className="step-card" whileHover={{ y: -4 }}>
              <span className="step-num mono">{n}</span>
              <strong>{t}</strong>
              <p>
                <MathText>{body}</MathText>
              </p>
            </motion.div>
          ))}
        </div>
        <div className="rules-grid" style={{ marginTop: 16 }}>
          <RuleCard title="Stationary point" tex="f'(x_0) = 0" />
          <RuleCard title="Minimum" tex="f''(x_0) > 0" note="Curve is a cup ∪, smiling" />
          <RuleCard title="Maximum" tex="f''(x_0) < 0" note="Curve is a cap ∩, frowning" />
          <RuleCard title="Gradient descent" tex="x_{k+1} = x_k - \alpha\,f'(x_k)" note="Walk downhill, step size $\alpha$" />
        </div>
      </Section>

      <Section id="play" kicker="Play" title="Train an AI… by hand" intro="Machine learning = minimising a **loss function** $L$. Neural nets can't solve $L'(x) = 0$ with algebra (millions of variables!), so they take small steps downhill instead. You're the optimiser now.">
        <DescentGolf />
      </Section>

      <MatlabSection topic="optimisation" />

      <Section id="practice" kicker="Practice" title="Optimisation drills">
        <Quiz id="w8-quiz" title="Max, Min & Descent" blurb="Find stationary points, classify them with $f''$, and compute gradient-descent steps." gens={ALL_GENS.optimisation} />
      </Section>
    </>
  );
}
