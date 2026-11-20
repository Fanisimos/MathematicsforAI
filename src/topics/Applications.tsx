import { useEffect, useRef, useState } from 'react';
import { AreaFill, C, Curve, Dot, Handle, Plot, Seg, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Section, Slider, Stat, Tabs } from '../components/UI';
import { easeInOut, fmt, quadRoots, simpson, tween, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { ALL_GENS } from './gens';
import { FOUND_GENS } from './gens_found';
import { NUM_GENS } from './gens_num';
import { autoView } from './shared';

/* ── 1. Area between curves ──────────────────────────────── */
function AreaBetween() {
  const [m, setM] = useState(1);
  const [c, setC] = useState(2);
  const top: Fn = (x) => m * x + c;
  const bot: Fn = (x) => x * x;
  const [r1, r2] = quadRoots(1, -m, -c);
  const area = (m * m + 4 * c) ** 1.5 / 6;
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3.5, xMax: 4.5, yMin: -1, yMax: 12 }} height={340} ariaLabel="Area between a line and a parabola">
          <AreaFill f={top} g={bot} from={r1} to={r2} color={C.area} opacity={0.45} />
          <Curve f={bot} />
          <Curve f={top} color={C.secant} />
          <Dot x={r1} y={bot(r1)} color={C.tangent} />
          <Dot x={r2} y={bot(r2)} color={C.tangent} />
          <Seg x1={(r1 + r2) / 2} y1={bot((r1 + r2) / 2)} x2={(r1 + r2) / 2} y2={top((r1 + r2) / 2)} color={C.text} dashed />
          <TextAt x={(r1 + r2) / 2} y={(top((r1 + r2) / 2) + bot((r1 + r2) / 2)) / 2} dx={8}>top − bottom</TextAt>
        </Plot>
      </div>
      <div className="explore-side">
        <Slider label="line slope $m$" value={m} min={-2} max={3} step={0.1} onChange={setM} />
        <Slider label="line height $c$" value={c} min={0.2} max={5} step={0.1} onChange={setC} />
        <ol className="recipe">
          <li>
            <MathText>{`**Where do they cross?** $x^2 = ${fmt(m)}x + ${fmt(c)}$ gives $x = ${fmt(r1)}$ and $x = ${fmt(r2)}$`}</MathText>
          </li>
          <li>
            <MathText>{`**Who's on top?** The line (check any $x$ in between).`}</MathText>
          </li>
          <li>
            <MathText>{`**Integrate top − bottom:** $$\\int_{${fmt(r1)}}^{${fmt(r2)}} \\big(${fmt(m)}x + ${fmt(c)} - x^2\\big)\\,dx = ${fmt(area, 3)}$$`}</MathText>
          </li>
        </ol>
        <Stat label="Enclosed area" value={fmt(area, 4)} tone="accent" />
      </div>
    </div>
  );
}

/* ── 2. Average value: flatten the area ──────────────────── */
const AVG: { key: string; label: string; f: Fn; a: number; b: number }[] = [
  { key: 'sq', label: '$x^2$ on $[0,2]$', f: (x) => x * x, a: 0, b: 2 },
  { key: 'sin', label: '$\\sin x$ on $[0,\\pi]$', f: Math.sin, a: 0, b: Math.PI },
  { key: 'wave', label: 'temperature', f: (x) => 12 + 6 * Math.sin((x - 9) * (Math.PI / 12)), a: 0, b: 24 },
];

function AverageValue() {
  const [k, setK] = useState('sin');
  const A = AVG.find((d) => d.key === k)!;
  const [t, setT] = useState(0);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);
  useEffect(() => setT(0), [k]);
  const avg = simpson(A.f, A.a, A.b) / (A.b - A.a);
  const morph: Fn = (x) => (1 - t) * A.f(x) + t * avg;
  const v = autoView(A.f, A.a - (A.b - A.a) * 0.08, A.b + (A.b - A.a) * 0.08, 0.2, 40);
  const pour = () => {
    const start = t, end = t < 0.5 ? 1 : 0;
    cancel.current = tween(1400, (p) => setT(start + (end - start) * easeInOut(p)));
  };
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={k} onChange={setK} options={AVG.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={{ ...v, yMin: Math.min(0, v.yMin) }} height={300} ariaLabel="Area morphing into a rectangle of equal area">
          <AreaFill f={morph} from={A.a} to={A.b} color={C.curve2} opacity={0.45} />
          <Curve f={A.f} opacity={1 - t * 0.6} />
          <Seg x1={A.a} y1={avg} x2={A.b} y2={avg} color={C.secant} dashed width={2} />
          <TextAt x={A.b} y={avg} dy={-8} anchor="end" color={C.secant}>average = {fmt(avg, 3)}</TextAt>
        </Plot>
      </div>
      <div className="explore-side">
        <button className="btn btn-primary" onClick={pour}>{t < 0.5 ? 'Flatten the area 🌊' : 'Un-flatten ↩'}</button>
        <Slider label="morph" value={t} min={0} max={1} step={0.01} onChange={setT} />
        <Tex block>{`\\bar f = \\frac{1}{b-a}\\int_a^b f(x)\\,dx = ${fmt(avg, 4)}`}</Tex>
        <Callout tone="info" icon="🌊">
          <MathText>Imagine the area is water. Let it settle flat and its height is the **average value**. The area never changes during the morph, which is why you divide the integral by the width.</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Probability = area ───────────────────────────────── */
function ProbabilityArea() {
  const [sd, setSd] = useState(1);
  const [a, setA] = useState(-1);
  const [b, setB] = useState(1);
  const pdf: Fn = (x) => Math.exp(-(x * x) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const P = simpson(pdf, lo, hi, 600);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -4, xMax: 4, yMin: -0.03, yMax: 0.85 }} height={300} ariaLabel="Normal distribution probability as area">
          <AreaFill f={pdf} from={lo} to={hi} color={C.good} opacity={0.45} />
          <Curve f={pdf} />
          <Handle x={a} y={0} lockY onDrag={(x) => setA(Math.round(x * 20) / 20)} color={C.secant} r={7} />
          <Handle x={b} y={0} lockY onDrag={(x) => setB(Math.round(x * 20) / 20)} color={C.secant} r={7} />
        </Plot>
        <p className="plot-caption">Drag the yellow knobs to change the interval</p>
      </div>
      <div className="explore-side">
        <Slider label="spread $\sigma$" value={sd} min={0.5} max={2} step={0.05} onChange={setSd} />
        <Tex block>{`P(${fmt(lo)} \\le X \\le ${fmt(hi)}) = \\int_{${fmt(lo)}}^{${fmt(hi)}} p(x)\\,dx = ${fmt(P, 4)}`}</Tex>
        <div className="meter big">
          <div className="meter-fill good" style={{ width: `${P * 100}%` }} />
          <span>{fmt(P * 100, 1)}%</span>
        </div>
        <div className="btn-row">
          {[1, 2, 3].map((k) => (
            <button key={k} className="chip" onClick={() => { setA(-k * sd); setB(k * sd); }}>
              ±{k}σ
            </button>
          ))}
        </div>
        <Callout tone="ai" icon="🎲">
          <MathText>Teaching Block 2 preview: every probability of a continuous variable is an **integral**. Total area under any density = 1. Try ±1σ, ±2σ, ±3σ: that's the famous 68–95–99.7 rule.</MathText>
        </Callout>
      </div>
    </div>
  );
}

const BOSS = [...Object.values(ALL_GENS), ...Object.values(FOUND_GENS), ...Object.values(NUM_GENS)].flat();

export default function Applications() {
  return (
    <>
      <Section id="between" kicker="Application 1" title="Area between two curves" intro="Area between curves = $\int (\text{top} - \text{bottom})\,dx$ between where they cross.">
        <AreaBetween />
      </Section>

      <Section id="average" kicker="Application 2" title="Average value of a function">
        <AverageValue />
      </Section>

      <Section id="prob" kicker="Application 3 · AI" title="Probability is area">
        <ProbabilityArea />
      </Section>

      <MatlabSection topic="applications" />

      <Section id="practice" kicker="Practice" title="Applications drills">
        <Quiz id="w12-quiz" title="Applications Drills" blurb="Areas between curves, average values, signed area and probability densities." gens={ALL_GENS.applications} />
      </Section>

      <Section id="boss" kicker="Final boss" title="Class test warm-up" intro="Every topic from the whole of Teaching Block 1, weeks 1–12, mixed and timed. Run it a few times before the in-class test.">
        <Quiz id="boss" boss title="TB1 Gauntlet" blurb="15 random questions from all 16 topics: sets to Simpson's rule. 60 seconds each, full working shown after every answer." gens={BOSS} rounds={15} secondsPerQuestion={60} />
      </Section>
    </>
  );
}
