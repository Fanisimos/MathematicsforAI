import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaFill, C, Curve, DataRect, Dot, Handle, Plot, Seg, SlopeLine, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { clamp, fmt, pick, riemann, simpson, type Fn, type RiemannMethod } from '../lib/math';
import { addXp, recordBest } from '../lib/progress';
import { MatlabSection } from '../matlab/MatlabSection';
import { ALL_GENS } from './gens';
import { autoView } from './shared';

type IFn = { key: string; label: string; tex: string; f: Fn; F: Fn; Ftex: string };
const IFUNCS: IFn[] = [
  { key: 'sq', label: '$x^2$', tex: 'x^2', f: (x) => x * x, F: (x) => x ** 3 / 3, Ftex: '\\tfrac{x^3}{3}' },
  { key: 'sin', label: '$\\sin x + 1$', tex: '\\sin x + 1', f: (x) => Math.sin(x) + 1, F: (x) => -Math.cos(x) + x, Ftex: '-\\cos x + x' },
  { key: 'cubic', label: '$\\frac{x^3}{4} - x + 2$', tex: '\\tfrac{x^3}{4} - x + 2', f: (x) => x ** 3 / 4 - x + 2, F: (x) => x ** 4 / 16 - x * x / 2 + 2 * x, Ftex: '\\tfrac{x^4}{16} - \\tfrac{x^2}{2} + 2x' },
  { key: 'exp', label: '$e^{x/2}$', tex: 'e^{x/2}', f: (x) => Math.exp(x / 2), F: (x) => 2 * Math.exp(x / 2), Ftex: '2e^{x/2}' },
];

/** Draw the Riemann rectangles / trapezia for f on [a, b]. */
function RiemannShapes({ f, a, b, n, method, color = C.area }: { f: Fn; a: number; b: number; n: number; method: RiemannMethod; color?: string }) {
  const h = (b - a) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x0 = a + i * h;
        if (method === 'trap') {
          const y0 = f(x0), y1 = f(x0 + h);
          return (
            <g key={i}>
              <AreaFill f={(t) => y0 + ((y1 - y0) * (t - x0)) / h} from={x0} to={x0 + h} samples={1} color={color} opacity={0.4} />
              <Seg x1={x0} y1={0} x2={x0} y2={y0} color={color} width={1} />
            </g>
          );
        }
        const xs = method === 'left' ? x0 : method === 'right' ? x0 + h : x0 + h / 2;
        return <DataRect key={i} x={x0} y={0} w={h} h={f(xs)} color={color} opacity={0.4} />;
      })}
    </>
  );
}

/* ── 1. Riemann sums ──────────────────────────────────────── */
function RiemannExplorer() {
  const [fk, setFk] = useState('sq');
  const F = IFUNCS.find((d) => d.key === fk)!;
  const view = useMemo(() => autoView(F.f, -1, 4, 0.12, 20), [F]);
  const [a, setA] = useState(0);
  const [b, setB] = useState(3);
  const [n, setN] = useState(4);
  const [method, setMethod] = useState<RiemannMethod>('left');
  const [anim, setAnim] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const lo = Math.min(a, b), hi = Math.max(a, b);
  const approx = riemann(F.f, lo, hi, n, method);
  const exact = F.F(hi) - F.F(lo);
  const err = approx - exact;

  const animate = () => {
    setAnim(true);
    let k = 1;
    setN(1);
    timer.current = window.setInterval(() => {
      k *= 2;
      if (k > 128) {
        window.clearInterval(timer.current);
        setAnim(false);
        return;
      }
      setN(k);
    }, 550);
  };

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={fk} onChange={setFk} options={IFUNCS.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={view} height={340} ariaLabel="Riemann sum rectangles">
          <RiemannShapes f={F.f} a={lo} b={hi} n={n} method={method} />
          <Curve f={F.f} />
          <Handle x={a} y={0} lockY onDrag={(x) => setA(Math.round(x * 10) / 10)} color={C.secant} r={7} />
          <Handle x={b} y={0} lockY onDrag={(x) => setB(Math.round(x * 10) / 10)} color={C.secant} r={7} />
          <TextAt x={a} y={0} dy={-14} anchor="middle" color={C.secant}>a</TextAt>
          <TextAt x={b} y={0} dy={-14} anchor="middle" color={C.secant}>b</TextAt>
        </Plot>
        <p className="plot-caption">Drag the yellow a and b knobs to change the interval</p>
      </div>
      <div className="explore-side">
        <Tabs small value={method} onChange={setMethod} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'mid', label: 'Midpoint' }, { value: 'trap', label: 'Trapezium' }]} />
        <Slider label="$n$ rectangles" value={n} min={1} max={128} step={1} onChange={(v) => !anim && setN(v)} format={(v) => `${v}`} />
        <button className="btn btn-primary" onClick={animate} disabled={anim}>
          {anim ? `n = ${n}…` : 'Double n until it fits ✨'}
        </button>
        <div className="stat-row">
          <Stat label="Approx" value={fmt(approx, 4)} tone="warn" />
          <Stat label="Exact" value={fmt(exact, 4)} tone="accent" />
          <Stat label="Error" value={fmt(err, 4)} tone={Math.abs(err) < 0.01 ? 'good' : 'bad'} />
        </div>
        <div className="meter">
          <motion.div className="meter-fill bad" animate={{ width: `${Math.min(100, (Math.abs(err) / Math.max(Math.abs(exact), 1)) * 400)}%` }} />
          <span>error size</span>
        </div>
        <Tex block>{`\\int_{${fmt(lo)}}^{${fmt(hi)}} ${F.tex}\\,dx = \\Big[${F.Ftex}\\Big]_{${fmt(lo)}}^{${fmt(hi)}} = ${fmt(exact, 4)}`}</Tex>
        <Callout tone="info" icon="🧱">
          <MathText>{`More rectangles → smaller error. The integral is the **limit** as $n \\to \\infty$. Midpoint & trapezium converge much faster (that's next week's numerical integration workshop!).`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Accumulation: FTC ─────────────────────────────────── */
const ACC: IFn[] = [
  { key: 't', label: '$f(t) = t$', tex: 't', f: (t) => t, F: (x) => (x * x) / 2, Ftex: '\\tfrac{x^2}{2}' },
  { key: 'cos', label: '$f(t) = \\cos t$', tex: '\\cos t', f: Math.cos, F: Math.sin, Ftex: '\\sin x' },
  { key: 'lin', label: '$f(t) = 2 - t$', tex: '2 - t', f: (t) => 2 - t, F: (x) => 2 * x - (x * x) / 2, Ftex: '2x - \\tfrac{x^2}{2}' },
];

function Accumulation() {
  const [k, setK] = useState('lin');
  const A = ACC.find((d) => d.key === k)!;
  const [x, setX] = useState(1.2);
  const fv = autoView(A.f, -0.3, 5, 0.15, 6);
  const av = autoView(A.F, -0.3, 5, 0.15, 14);
  const pos = (t: number) => Math.max(0, A.f(t));
  const neg = (t: number) => Math.min(0, A.f(t));
  return (
    <div className="explore">
      <div className="explore-plot stacked">
        <Tabs small value={k} onChange={setK} options={ACC.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={fv} height={230} onScrub={(nx) => setX(clamp(nx, 0, 5))} xLabel="t" yLabel="f(t)" ariaLabel="Area accumulating under f">
          <AreaFill f={pos} from={0} to={x} color={C.good} opacity={0.4} />
          <AreaFill f={neg} from={0} to={x} color={C.bad} opacity={0.4} />
          <Curve f={A.f} />
          <Seg x1={x} y1={0} x2={x} y2={A.f(x)} color={C.secant} width={3} />
          <Dot x={x} y={A.f(x)} color={C.secant} />
        </Plot>
        <Plot view={av} height={210} onScrub={(nx) => setX(clamp(nx, 0, 5))} yLabel="A(x)" ariaLabel="Accumulated area function">
          <Curve f={A.F} color={C.curve2} dashed opacity={0.35} from={0} />
          <Curve f={A.F} color={C.curve2} from={0} to={x} />
          <SlopeLine x0={x} y0={A.F(x)} m={A.f(x)} color={C.secant} width={2} />
          <Dot x={x} y={A.F(x)} color={C.curve2} />
        </Plot>
      </div>
      <div className="explore-side">
        <p className="muted">
          <MathText>{`Drag along either plot. Top: area under $f$ from $0$ to $x$ (green counts +, red counts −). Bottom: that area as a function $A(x)$.`}</MathText>
        </p>
        <div className="stat-row">
          <Stat label="Area so far $A(x)$" value={fmt(A.F(x), 3)} tone="accent" />
          <Stat label="Height $f(x)$" value={fmt(A.f(x), 3)} tone="warn" />
        </div>
        <Stat label="Slope of $A$ at $x$" value={fmt(A.f(x), 3)} tone="warn" />
        <Callout tone="good" icon="🤯">
          <MathText>{`The slope of the area-graph **equals** the height of $f$. So $A'(x) = f(x)$: integration and differentiation undo each other. That's the **Fundamental Theorem of Calculus**, and it's why $\\int ${A.tex}\\,dt$ is $${A.Ftex}$.`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Game: Area Guess ──────────────────────────────────── */
function makeArea() {
  const kind = pick(['quad', 'bump', 'line', 'cubic'] as const);
  const r = (lo: number, hi: number) => Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
  let f: Fn;
  if (kind === 'quad') {
    const c = r(1, 3), k = r(0.1, 0.35), q = r(0.5, 2);
    f = (x) => k * (x - c) ** 2 + q;
  } else if (kind === 'bump') {
    const A = r(1.5, 3.5), B = r(0.3, 1.2);
    f = (x) => A * Math.sin((Math.PI * x) / 4) + B;
  } else if (kind === 'line') {
    const m = r(-0.35, 0.6), q = r(1.6, 2.6);
    f = (x) => m * x + q + 0.2;
  } else {
    const q = r(1.2, 2.5);
    f = (x) => 0.12 * (x - 2) ** 3 - 0.3 * (x - 2) + q;
  }
  return { f, a: 0, b: 4 };
}

const AREA_ROUNDS = 5;
function AreaGuess() {
  const [g, setG] = useState(makeArea);
  const [guess, setGuess] = useState(6);
  const [round, setRound] = useState(0);
  const [total, setTotal] = useState(0);
  const [reveal, setReveal] = useState<null | number>(null);
  const [pts, setPts] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const exact = simpson(g.f, g.a, g.b);
  const view = { xMin: -0.3, xMax: 4.3, yMin: -0.4, yMax: 5.5 };

  const lock = () => {
    const rel = Math.abs(guess - exact) / exact;
    const p = Math.max(0, Math.round(100 - rel * 250));
    setPts(p);
    setTotal((t) => t + p);
    let n = 1;
    setReveal(1);
    timer.current = window.setInterval(() => {
      n *= 2;
      if (n > 64) {
        window.clearInterval(timer.current);
        setReveal(0);
        return;
      }
      setReveal(n);
    }, 300);
  };
  const next = () => {
    if (round + 1 >= AREA_ROUNDS) {
      recordBest('w10-area', total / (AREA_ROUNDS * 100));
      addXp(total / 8);
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setG(makeArea());
    setReveal(null);
  };
  const restart = () => {
    setRound(0);
    setTotal(0);
    setDone(false);
    setG(makeArea());
    setReveal(null);
  };

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game</span>
          <h3>Area Guess</h3>
          <p className="muted">Each grid square is 1 × 1. Estimate the shaded area under the curve from 0 to 4. Counting squares is allowed (and smart)!</p>
        </div>
        <div className="game-score mono">
          <span>Round {Math.min(round + 1, AREA_ROUNDS)}/{AREA_ROUNDS}</span>
          <strong>{total} pts</strong>
        </div>
      </div>
      {done ? (
        <div className="quiz-done">
          {total >= 350 && <Confetti />}
          <div className="big-score mono">{total}/500</div>
          <p className="done-msg">{total >= 420 ? 'Human integrator! 🧮' : total >= 280 ? 'Good estimates. Try mentally splitting into rectangles.' : 'Try counting whole squares, then add the half-squares.'}</p>
          <button className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div className="explore">
          <div className="explore-plot">
            <Plot view={view} height={320} ariaLabel="Area guessing game">
              {Array.from({ length: 5 }, (_, i) => (
                <Seg key={`v${i}`} x1={i} y1={0} x2={i} y2={5.5} color={C.axis} width={1} opacity={0.6} />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <Seg key={`h${i}`} x1={0} y1={i} x2={4} y2={i} color={C.axis} width={1} opacity={0.6} />
              ))}
              {reveal === null || reveal === 0 ? (
                <AreaFill f={g.f} from={0} to={4} color={reveal === 0 ? C.good : C.area} opacity={0.4} />
              ) : (
                <RiemannShapes f={g.f} a={0} b={4} n={reveal} method="mid" color={C.good} />
              )}
              <Curve f={g.f} />
            </Plot>
          </div>
          <div className="explore-side">
            <Slider label="Your guess" value={guess} min={0} max={20} step={0.1} onChange={(v) => reveal === null && setGuess(v)} />
            {reveal === null ? (
              <button className="btn btn-primary btn-lg" onClick={lock}>Lock in guess</button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="feedback good">
                <strong className="mono">+{pts} pts</strong>
                <div>
                  You guessed <span className="mono">{fmt(guess)}</span>. Exact area: <span className="mono">{fmt(exact, 3)}</span>
                  {' '}({fmt((Math.abs(guess - exact) / exact) * 100, 1)}% off).
                </div>
                <button className="btn btn-primary" onClick={next} disabled={reveal !== 0}>
                  {round + 1 >= AREA_ROUNDS ? 'Finish' : 'Next curve →'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Integration() {
  return (
    <>
      <Section id="riemann" kicker="The big idea" title="Area = adding up thin rectangles" intro="To find the area under a curve, chop it into $n$ rectangles and add them up. Then let $n \to \infty$. That limit is the **definite integral** $\int_a^b f(x)\,dx$.">
        <RiemannExplorer />
      </Section>

      <Section id="ftc" kicker="The magic link" title="Integration undoes differentiation">
        <Accumulation />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Integration rules" intro="Each rule is a derivative rule run backwards. Always check by differentiating your answer.">
        <div className="rules-grid">
          <RuleCard title="Reverse power rule" tex="\int x^n\,dx = \frac{x^{n+1}}{n+1} + C" note="$n \neq -1$. Up one, divide by new power" />
          <RuleCard title="The +C" tex="\frac{d}{dx}(F + C) = f" note="Constants vanish when differentiated, so we can't know them" />
          <RuleCard title="The exception" tex="\int \frac{1}{x}\,dx = \ln|x| + C" />
          <RuleCard title="Exponential" tex="\int e^{kx}\,dx = \frac{1}{k}e^{kx} + C" />
          <RuleCard title="Trig" tex="\int \cos x\,dx = \sin x + C" note="and $\int \sin x\,dx = -\cos x + C$" />
          <RuleCard title="Definite integral" tex="\int_a^b f\,dx = F(b) - F(a)" note="No +C needed, it cancels" />
        </div>
      </Section>

      <Section id="play" kicker="Play" title="Be the integral">
        <AreaGuess />
      </Section>

      <MatlabSection topic="integration" />

      <Section id="practice" kicker="Practice" title="Integration drills">
        <Quiz id="w10-quiz" title="Integration Drills" blurb="Antiderivatives, definite integrals, standard integrals and rectangle estimates." gens={ALL_GENS.integration} />
      </Section>
    </>
  );
}
