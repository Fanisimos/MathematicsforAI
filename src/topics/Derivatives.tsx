import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { C, Curve, Dot, Handle, Plot, Seg, SlopeLine, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { clamp, deriv, fmt, pick, tween } from '../lib/math';
import { addXp, recordBest } from '../lib/progress';
import { ALL_GENS } from './gens';
import { autoView, type FnDef } from './shared';

const FUNCS: FnDef[] = [
  { key: 'sq', label: '$x^2$', f: (x) => x * x, tex: 'x^2', dtex: '2x' },
  { key: 'cubic', label: '$\\frac{x^3}{3} - x$', f: (x) => x ** 3 / 3 - x, tex: '\\tfrac{x^3}{3} - x', dtex: 'x^2 - 1' },
  { key: 'sin', label: '$\\sin x$', f: Math.sin, tex: '\\sin x', dtex: '\\cos x' },
  { key: 'exp', label: '$e^{x}$', f: Math.exp, tex: 'e^{x}', dtex: 'e^{x}' },
];

/* ── 1. Rise over run ─────────────────────────────────────── */
function RiseOverRun() {
  const [p, setP] = useState({ x: -2, y: -1 });
  const [q, setQ] = useState({ x: 2, y: 2 });
  const run = q.x - p.x;
  const rise = q.y - p.y;
  const m = Math.abs(run) < 1e-6 ? NaN : rise / run;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -5, xMax: 5, yMin: -4, yMax: 4 }} height={320} ariaLabel="Line through two draggable points">
          {isFinite(m) && <SlopeLine x0={p.x} y0={p.y} m={m} color={C.curve} />}
          <Seg x1={p.x} y1={p.y} x2={q.x} y2={p.y} color={C.secant} dashed />
          <Seg x1={q.x} y1={p.y} x2={q.x} y2={q.y} color={C.good} dashed />
          <TextAt x={(p.x + q.x) / 2} y={p.y} dy={rise >= 0 ? 18 : -8} anchor="middle" color={C.secant}>run = {fmt(run)}</TextAt>
          <TextAt x={q.x} y={(p.y + q.y) / 2} dx={8} color={C.good}>rise = {fmt(rise)}</TextAt>
          <Handle x={p.x} y={p.y} onDrag={(x, y) => setP({ x, y })} color={C.tangent} />
          <Handle x={q.x} y={q.y} onDrag={(x, y) => setQ({ x, y })} color={C.curve2} />
        </Plot>
      </div>
      <div className="explore-side">
        <p className="muted">
          <MathText>Drag either dot. The gradient tells you how much $y$ changes for each step of 1 in $x$.</MathText>
        </p>
        <Tex block>{`m = \\frac{\\text{rise}}{\\text{run}} = \\frac{${fmt(rise)}}{${fmt(run)}} = ${isFinite(m) ? fmt(m) : '\\text{undefined}'}`}</Tex>
        <div className="stat-row">
          <Stat label="Gradient" value={isFinite(m) ? fmt(m) : 'vertical'} tone={m > 0 ? 'good' : m < 0 ? 'bad' : undefined} />
          <Stat label="Direction" value={!isFinite(m) ? '|' : m > 0.05 ? '↗ uphill' : m < -0.05 ? '↘ downhill' : '→ flat'} />
        </div>
        <Callout tone="info" icon="💡">
          A straight line has <strong>one</strong> gradient everywhere. A curve's gradient keeps changing, so how do we measure it at a single point? Scroll down. ↓
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Secant → tangent ─────────────────────────────────── */
function SecantToTangent() {
  const [fk, setFk] = useState('sq');
  const F = FUNCS.find((d) => d.key === fk)!;
  const view = useMemo(() => autoView(F.f, -3, 3, 0.2, 12), [F]);
  const [a, setA] = useState(0.8);
  const [h, setH] = useState(1.6);
  const [busy, setBusy] = useState(false);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);

  const fa = F.f(a);
  const fah = F.f(a + h);
  const m = (fah - fa) / h;
  const true_m = deriv(F.f, a);
  const tangent = Math.abs(h) < 0.03;

  const shrink = () => {
    const h0 = h;
    const sign = Math.sign(h0) || 1;
    setBusy(true);
    cancel.current = tween(
      2600,
      (t) => setH(sign * Math.abs(h0) * Math.pow(0.0005 / Math.abs(h0), t * t)),
      () => setBusy(false),
    );
  };

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={fk} onChange={setFk} options={FUNCS.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={view} height={360} onScrub={(x) => setA(clamp(x, -2.6, 2.6))} ariaLabel="Secant line approaching tangent">
          <Curve f={F.f} />
          {!tangent && (
            <>
              <Seg x1={a} y1={fa} x2={a + h} y2={fa} color={C.secant} dashed opacity={0.8} />
              <Seg x1={a + h} y1={fa} x2={a + h} y2={fah} color={C.good} dashed opacity={0.8} />
            </>
          )}
          <SlopeLine x0={a} y0={fa} m={m} color={tangent ? C.tangent : C.secant} width={tangent ? 3.5 : 2.5} />
          <Dot x={a} y={fa} color={C.tangent} r={7} />
          {!tangent && <Handle x={a + h} y={fah} lockY onDrag={(x) => !busy && setH(Math.abs(x - a) < 0.001 ? 0.001 : x - a)} color={C.secant} r={7} />}
          {!tangent && <TextAt x={a + h / 2} y={fa} dy={18} anchor="middle" color={C.secant}>h</TextAt>}
        </Plot>
        <p className="plot-caption">Drag on the graph to move the pink point · drag the yellow point to change h</p>
      </div>
      <div className="explore-side">
        <Slider label="$h$ (gap between points)" value={h} min={-2} max={2} step={0.001} onChange={(v) => setH(Math.abs(v) < 0.001 ? 0.001 : v)} format={(v) => fmt(v, 4)} />
        <button className="btn btn-primary" onClick={shrink} disabled={busy || Math.abs(h) < 0.01}>
          {busy ? 'Shrinking…' : 'Shrink h → 0 ✨'}
        </button>
        <button className="btn btn-ghost" onClick={() => setH(1.6)} disabled={busy}>
          Reset h
        </button>
        <Tex block>{`\\frac{f(a+h) - f(a)}{h} = \\frac{${fmt(fah - fa, 3)}}{${fmt(h, 4)}} = ${fmt(m, 4)}`}</Tex>
        <div className="stat-row">
          <Stat label="Secant slope" value={fmt(m, 4)} tone="warn" />
          <Stat label={`True $f'(${fmt(a)})$`} value={fmt(true_m, 4)} tone="accent" />
        </div>
        <AnimatePresence>
          {tangent && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Callout tone="good" icon="🎯">
                <MathText>{`As $h \\to 0$ the secant **becomes the tangent**. Its slope is the derivative: $$f'(a) = \\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}$$ For $f(x) = ${F.tex}$ that's $f'(x) = ${F.dtex}$.`}</MathText>
              </Callout>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── 3. Derivative tracer ───────────────────────────────── */
function DerivativeTracer() {
  const [fk, setFk] = useState('cubic');
  const F = FUNCS.find((d) => d.key === fk)!;
  const df = (x: number) => deriv(F.f, x);
  const view = useMemo(() => autoView(F.f, -3, 3, 0.15, 10), [F]);
  const dview = useMemo(() => autoView(df, -3, 3, 0.2, 10), [F]); // eslint-disable-line react-hooks/exhaustive-deps
  const [x, setX] = useState(-2.2);
  const [trail, setTrail] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setTrail([]);
    setReveal(false);
  }, [fk]);

  const move = (nx: number) => {
    setX(nx);
    const q = Math.round(nx * 20) / 20;
    setTrail((t) => (t.includes(q) ? t : [...t, q]));
  };
  const slope = df(x);
  const coverage = trail.length / 121;

  return (
    <div className="explore">
      <div className="explore-plot stacked">
        <Tabs small value={fk} onChange={setFk} options={FUNCS.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={view} height={250} onScrub={(nx) => move(nx)} yLabel="f(x)" ariaLabel="Function with tangent">
          <Curve f={F.f} />
          <SlopeLine x0={x} y0={F.f(x)} m={slope} color={C.tangent} />
          <Dot x={x} y={F.f(x)} r={7} />
        </Plot>
        <Plot view={dview} height={210} onScrub={(nx) => move(nx)} yLabel="f′(x)" ariaLabel="Traced derivative">
          {reveal && <Curve f={df} color={C.curve2} width={2.5} dashed />}
          {trail.map((t) => (
            <Dot key={t} x={t} y={df(t)} r={3.2} color={df(t) >= 0 ? C.good : C.bad} stroke="none" />
          ))}
          <Seg x1={x} y1={0} x2={x} y2={slope} color={slope >= 0 ? C.good : C.bad} width={3} />
          <Dot x={x} y={slope} r={7} color={slope >= 0 ? C.good : C.bad} />
        </Plot>
        <p className="plot-caption">Drag across either graph. Each slope you visit gets painted below.</p>
      </div>
      <div className="explore-side">
        <p className="muted">
          <MathText>Top: $f(x)$ and its tangent. Bottom: the **slope of that tangent** plotted as a height. Paint the whole bottom graph and you've drawn $f'(x)$ by hand.</MathText>
        </p>
        <div className="stat-row">
          <Stat label="$x$" value={fmt(x)} />
          <Stat label="slope $f'(x)$" value={fmt(slope)} tone={slope > 0.02 ? 'good' : slope < -0.02 ? 'bad' : 'warn'} />
        </div>
        <div className="meter">
          <div className="meter-fill" style={{ width: `${Math.min(1, coverage) * 100}%` }} />
          <span>{Math.round(Math.min(1, coverage) * 100)}% painted</span>
        </div>
        <button className="btn btn-ghost" onClick={() => setReveal((r) => !r)}>
          {reveal ? 'Hide' : 'Reveal'} the true <Tex>{`f'(x) = ${F.dtex}`}</Tex>
        </button>
        <Callout tone="info" icon="👀">
          <MathText>Notice: where $f$ peaks or dips, the bottom graph crosses **zero**. That's the key idea for next week's max/min.</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 4. Game: Slope Sniper ───────────────────────────────── */
const SNIPER_POOL: FnDef[] = [
  { key: 'a', label: '', f: (x) => 0.5 * x * x },
  { key: 'b', label: '', f: (x) => 2 * Math.sin(x) },
  { key: 'c', label: '', f: (x) => x ** 3 / 6 - x },
  { key: 'd', label: '', f: (x) => Math.exp(x / 2) },
  { key: 'e', label: '', f: (x) => 2 * Math.cos(x) },
  { key: 'g', label: '', f: (x) => -0.4 * x * x + x },
];
const ROUNDS = 5;
const ARM = 1.4;

function SlopeSniper() {
  const [round, setRound] = useState(0);
  const [fn, setFn] = useState(() => pick(SNIPER_POOL));
  const [x0, setX0] = useState(() => Math.round((Math.random() * 4 - 2) * 10) / 10);
  const [m, setM] = useState(0);
  const [locked, setLocked] = useState(false);
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const view = useMemo(() => {
    const v = autoView(fn.f, -3.5, 3.5, 0.3, 10);
    return { ...v, yMin: Math.min(v.yMin, -3), yMax: Math.max(v.yMax, 3) };
  }, [fn]);
  const y0 = fn.f(x0);
  const truth = deriv(fn.f, x0);

  const fire = () => {
    const err = (Math.abs(Math.atan(m) - Math.atan(truth)) * 180) / Math.PI;
    const pts = Math.max(0, Math.round(100 - err * 4));
    setLast(pts);
    setTotal((t) => t + pts);
    setLocked(true);
  };
  const nextRound = () => {
    if (round + 1 >= ROUNDS) {
      recordBest('w7-sniper', total / (ROUNDS * 100));
      addXp(total / 8);
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setFn(pick(SNIPER_POOL));
    setX0(Math.round((Math.random() * 4 - 2) * 10) / 10);
    setM(0);
    setLocked(false);
    setLast(null);
  };
  const restart = () => {
    setRound(0);
    setTotal(0);
    setDone(false);
    setFn(pick(SNIPER_POOL));
    setM(0);
    setLocked(false);
    setLast(null);
  };

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game</span>
          <h3>Slope Sniper</h3>
          <p className="muted">Tilt the line so it just <em>kisses</em> the curve at the target. Closer angle = more points.</p>
        </div>
        <div className="game-score mono">
          <span>Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</span>
          <strong>{total} pts</strong>
        </div>
      </div>
      {done ? (
        <div className="quiz-done">
          {total >= 350 && <Confetti />}
          <div className="big-score mono">{total}/500</div>
          <p className="done-msg">{total >= 450 ? 'Sniper elite. Your eye for gradients is sharp. 🎯' : total >= 300 ? 'Solid aim! Practise curvy ones like sin.' : 'Keep going. Watch how the tangent hugs the curve after each shot.'}</p>
          <button className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div className="explore">
          <div className="explore-plot">
            <Plot view={view} height={340} ariaLabel="Slope sniper game">
              <Curve f={fn.f} />
              <SlopeLine x0={x0} y0={y0} m={m} color={locked ? C.secant : C.text} width={2.5} dashed={!locked} />
              {locked && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SlopeLine x0={x0} y0={y0} m={truth} color={C.tangent} width={3.5} />
                </motion.g>
              )}
              <Dot x={x0} y={y0} r={9} color={C.tangent} />
              {!locked && (
                <Handle
                  x={x0 + ARM}
                  y={y0 + m * ARM}
                  lockX
                  onDrag={(_, y) => setM((y - y0) / ARM)}
                  color={C.secant}
                />
              )}
            </Plot>
            <p className="plot-caption">Drag the yellow knob up/down (or use the slider) to tilt your line</p>
          </div>
          <div className="explore-side">
            <Slider label="Your slope $m$" value={m} min={-5} max={5} step={0.05} onChange={(v) => !locked && setM(v)} />
            {!locked ? (
              <button className="btn btn-primary btn-lg" onClick={fire}>🎯 Lock in</button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="feedback good">
                <strong className="mono">+{last} pts</strong>
                <div>
                  You said <span className="mono">{fmt(m)}</span>, the true tangent slope is <span className="mono">{fmt(truth)}</span>.
                </div>
                <button className="btn btn-primary" onClick={nextRound}>{round + 1 >= ROUNDS ? 'Finish' : 'Next target →'}</button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Derivatives() {
  return (
    <>
      <Section id="line" kicker="Warm-up" title="Gradient of a straight line" intro="Before curves, the simplest case. Gradient = steepness = how fast $y$ changes as $x$ changes.">
        <RiseOverRun />
      </Section>

      <Section id="limit" kicker="The big idea" title="From secant to tangent" intro="To get the slope at **one** point on a curve, take a second point a tiny distance $h$ away and let $h$ shrink to zero. Hit the button and watch.">
        <SecantToTangent />
      </Section>

      <Section id="tracer" kicker="See it" title="Paint the derivative" intro="The derivative $f'(x)$ is itself a function: it tells you the slope of $f$ at every $x$.">
        <DerivativeTracer />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Rules you'll use every day" intro="Every one of these comes from that $h \to 0$ limit. You don't redo the limit each time, you just use the rule.">
        <div className="rules-grid">
          <RuleCard title="Power rule" tex="\frac{d}{dx}x^n = nx^{n-1}" note="Bring the power down, reduce by one" />
          <RuleCard title="Constant multiple" tex="\frac{d}{dx}\,a f(x) = a f'(x)" />
          <RuleCard title="Sum rule" tex="(f+g)' = f' + g'" note="Differentiate term by term" />
          <RuleCard title="Constants vanish" tex="\frac{d}{dx}\,c = 0" note="A flat line has zero slope" />
          <RuleCard title="Exponential" tex="\frac{d}{dx}e^{x} = e^{x}" note="The function that is its own slope" />
          <RuleCard title="Log" tex="\frac{d}{dx}\ln x = \frac{1}{x}" />
          <RuleCard title="Trig" tex="\frac{d}{dx}\sin x = \cos x" note="and $\frac{d}{dx}\cos x = -\sin x$" />
          <RuleCard title="Roots & fractions" tex="\sqrt{x} = x^{1/2},\;\; \tfrac1x = x^{-1}" note="Rewrite as powers first, then power rule" />
        </div>
      </Section>

      <Section id="play" kicker="Play" title="Train your eye">
        <SlopeSniper />
      </Section>

      <Section id="practice" kicker="Practice" title="Derivative drills">
        <Quiz id="w7-quiz" title="Derivative Drills" blurb="Power rule, polynomials, tangent gradients and the standard derivatives, all randomised. Wrong answers show full working." gens={ALL_GENS.derivatives} />
      </Section>
    </>
  );
}
