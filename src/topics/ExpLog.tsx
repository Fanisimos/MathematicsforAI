import { motion } from 'framer-motion';
import { useState } from 'react';
import { C, Curve, Dot, Plot, Seg, SlopeLine, TextAt } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { clamp, fmt } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { FOUND_GENS } from './gens_found';

/* ── 1. Exponential growth & decay ──────────────────────── */
function ExpExplorer() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [x, setX] = useState(1);
  const f = (t: number) => a * b ** t;
  const slope = a * b ** x * Math.log(b);
  const ratio = slope / f(x);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3, xMax: 3, yMin: -0.5, yMax: 8 }} height={330} onScrub={(nx) => setX(nx)} ariaLabel="Exponential function">
          <Curve f={f} />
          <SlopeLine x0={x} y0={f(x)} m={slope} color={C.tangent} width={2} />
          <Dot x={x} y={f(x)} />
          <Dot x={0} y={a} color={C.secant} r={6} />
          <TextAt x={0} y={a} dx={10} dy={-8} color={C.secant}>(0, a)</TextAt>
        </Plot>
      </div>
      <div className="explore-side">
        <Tex block>{`y = ${fmt(a)}\\cdot ${fmt(b, 3)}^{x}`}</Tex>
        <Slider label="start value $a$" value={a} min={0.5} max={3} step={0.1} onChange={setA} />
        <Slider label="base $b$" value={b} min={0.2} max={3} step={0.01} onChange={setB} format={(v) => fmt(v, 3)} />
        <div className="btn-row">
          <button className="chip" onClick={() => setB(Math.E)}>b = e ≈ 2.718</button>
          <button className="chip" onClick={() => setB(0.5)}>b = ½ (decay)</button>
        </div>
        <div className="stat-row">
          <Stat label="value $f(x)$" value={fmt(f(x), 3)} />
          <Stat label="slope $f'(x)$" value={fmt(slope, 3)} tone="accent" />
          <Stat label="slope ÷ value" value={fmt(ratio, 3)} tone={Math.abs(ratio - 1) < 0.01 ? 'good' : undefined} />
        </div>
        <Callout tone={Math.abs(b - Math.E) < 0.005 ? 'good' : 'info'} icon="✨">
          <MathText>{`For any base, slope ÷ value is the constant $\\ln b = ${fmt(Math.log(b), 3)}$. Only for $b = e$ is it exactly **1**: $e^x$ is its own slope. That's why $e$ is everywhere in calculus and AI.`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Logs as inverses ────────────────────────────────── */
function LogInverse() {
  const [b, setB] = useState(2);
  const [N, setN] = useState(4);
  const k = Math.log(N) / Math.log(b);
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -2, xMax: 9, yMin: -3, yMax: 6 }} width={492} height={398} onScrub={(nx) => setN(clamp(nx, 0.2, 9))} ariaLabel="Exponential and logarithm reflected in y = x">
          <Seg x1={-5} y1={-5} x2={10} y2={10} color={C.muted} dashed width={1} />
          <Curve f={(t) => b ** t} color={C.curve2} width={2.5} opacity={0.7} />
          <Curve f={(t) => (t > 0 ? Math.log(t) / Math.log(b) : NaN)} color={C.curve} />
          <Seg x1={N} y1={0} x2={N} y2={k} color={C.secant} dashed />
          <Seg x1={0} y1={k} x2={N} y2={k} color={C.tangent} dashed />
          <Dot x={N} y={k} />
          <TextAt x={8.8} y={b ** 2.2 > 6 ? 5.4 : b ** 2.2} anchor="end" color={C.curve2}>{`${fmt(b)}^x`}</TextAt>
          <TextAt x={8.8} y={Math.log(8.8) / Math.log(b)} dy={-8} anchor="end" color={C.curve}>{`log_${fmt(b)} x`}</TextAt>
        </Plot>
        <p className="plot-caption">Drag along the graph to pick N</p>
      </div>
      <div className="explore-side">
        <Slider label="base $b$" value={b} min={1.2} max={10} step={0.1} onChange={setB} />
        <Slider label="$N$" value={N} min={0.2} max={9} step={0.01} onChange={setN} />
        <Tex block>{`\\log_{${fmt(b)}} ${fmt(N)} = ${fmt(k, 3)} \\quad\\Longleftrightarrow\\quad ${fmt(b)}^{${fmt(k, 3)}} = ${fmt(N)}`}</Tex>
        <Callout tone="info" icon="❓">
          <MathText>{'$\\log_b N$ answers one question: **"what power of $b$ gives $N$?"** The log curve is the exponential curve reflected in $y = x$.'}</MathText>
        </Callout>
        <Callout tone="warn" icon="⚠️">
          <MathText>{'Logs of **zero or negatives** are undefined: no power of a positive base gives 0 or a negative number.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Slide rule ──────────────────────────────────────── */
const L = 40, Wd = 520;
const pos = (v: number) => L + Wd * Math.log10(v);
const TICKS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];

function SlideRule() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const prod = a * b;
  const wrap = prod > 10;
  const shown = wrap ? prod / 10 : prod;
  const offset = Wd * Math.log10(a);
  const cursorX = wrap ? pos(b) + offset - Wd : pos(b) + offset;
  return (
    <div className="explore">
      <div className="explore-plot">
        <svg viewBox="0 0 600 200" className="plot sliderule" role="img" aria-label="Slide rule">
          <rect x={20} y={20} width={560} height={60} rx={8} className="sr-body" />
          {TICKS.map((t) => (
            <g key={`t${t}`}>
              <line x1={pos(t)} x2={pos(t)} y1={80} y2={62} className="sr-tick" />
              <text x={pos(t)} y={55} textAnchor="middle" className="sr-num">{t}</text>
            </g>
          ))}
          <text x={26} y={36} className="sr-name">D</text>
          <motion.g animate={{ x: wrap ? offset - Wd : offset }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
            <rect x={20} y={84} width={560} height={60} rx={8} className="sr-slide" />
            {TICKS.map((t) => (
              <g key={`b${t}`}>
                <line x1={pos(t)} x2={pos(t)} y1={84} y2={102} className="sr-tick" />
                <text x={pos(t)} y={118} textAnchor="middle" className="sr-num">{t}</text>
              </g>
            ))}
            <text x={26} y={138} className="sr-name">C</text>
          </motion.g>
          <motion.g animate={{ x: cursorX }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
            <rect x={-8} y={12} width={16} height={140} rx={4} className="sr-cursor" />
            <line x1={0} x2={0} y1={12} y2={152} className="sr-hair" />
          </motion.g>
          <text x={300} y={186} textAnchor="middle" className="sr-read">
            {fmt(a)} × {fmt(b)} = {fmt(prod, 3)}
            {wrap ? `  (read ${fmt(shown, 3)} on D, ×10)` : ''}
          </text>
        </svg>
      </div>
      <div className="explore-side">
        <Slider label="$a$" value={a} min={1} max={10} step={0.1} onChange={setA} />
        <Slider label="$b$" value={b} min={1} max={10} step={0.1} onChange={setB} />
        <Tex block>{`\\log ${fmt(a)} + \\log ${fmt(b)} = ${fmt(Math.log10(a), 3)} + ${fmt(Math.log10(b), 3)} = ${fmt(Math.log10(prod), 3)} = \\log ${fmt(prod, 3)}`}</Tex>
        <Callout tone="info" icon="📏">
          <MathText>{'On a log scale, distances are logs. Sliding the C scale **adds** lengths, so it **multiplies** numbers: $\\log(ab) = \\log a + \\log b$. Engineers used this to reach the Moon.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 4. Softmax & cross-entropy ─────────────────────────── */
const CLASSES = ['🐱 cat', '🐶 dog', '🐰 rabbit'];
function Softmax() {
  const [z, setZ] = useState([2, 1, -0.5]);
  const [T, setT] = useState(1);
  const [truth, setTruth] = useState('0');
  const ex = z.map((v) => Math.exp(v / T));
  const S = ex.reduce((s, v) => s + v, 0);
  const p = ex.map((v) => v / S);
  const ti = Number(truth);
  const loss = -Math.log(p[ti]);
  return (
    <div className="explore">
      <div className="explore-plot">
        <div className="softmax">
          {CLASSES.map((c, i) => (
            <div key={c} className={`sm-row ${i === ti ? 'truth' : ''}`}>
              <span className="sm-label">{c}</span>
              <div className="sm-track">
                <motion.div className="sm-bar" animate={{ width: `${p[i] * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
              </div>
              <span className="mono sm-val">{fmt(p[i] * 100, 1)}%</span>
            </div>
          ))}
        </div>
        <Tex block>{`p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}} \\qquad \\text{loss} = -\\ln p_{\\text{true}} = -\\ln(${fmt(p[ti], 3)}) = ${fmt(loss, 3)}`}</Tex>
      </div>
      <div className="explore-side">
        {z.map((v, i) => (
          <Slider key={i} label={`score $z_${i + 1}$ (${CLASSES[i].split(' ')[1]})`} value={v} min={-3} max={4} step={0.1} onChange={(nv) => setZ(z.map((w, j) => (j === i ? nv : w)))} />
        ))}
        <Slider label="temperature $T$" value={T} min={0.2} max={4} step={0.05} onChange={setT} />
        <div className="pick-row">
          <span className="muted small">true answer:</span>
          <Tabs small value={truth} onChange={setTruth} options={CLASSES.map((c, i) => ({ value: `${i}`, label: c }))} />
        </div>
        <Stat label="cross-entropy loss" value={fmt(loss, 3)} tone={loss < 0.3 ? 'good' : loss > 1.5 ? 'bad' : 'warn'} />
        <Callout tone="ai" icon="🧠">
          <MathText>{'**Exp** turns any scores into positive numbers; dividing by the sum makes them probabilities. **Log** then measures how surprised the model is by the right answer. Confident and wrong = huge loss. This exact formula trains image classifiers and chatbots.'}</MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function ExpLog() {
  return (
    <>
      <Section id="exp" kicker="Exponentials" title="Growth that feeds on itself" intro="In $a\,b^x$ the variable is in the **exponent**. Every step of 1 in $x$ multiplies $y$ by $b$. Drag along the curve.">
        <ExpExplorer />
      </Section>

      <Section id="log" kicker="Logarithms" title="Logs undo exponentials">
        <LogInverse />
      </Section>

      <Section id="laws" kicker="Log laws" title="Multiplication becomes addition">
        <SlideRule />
        <div className="rules-grid" style={{ marginTop: 16 }}>
          <RuleCard title="Product" tex="\log(xy) = \log x + \log y" />
          <RuleCard title="Quotient" tex="\log\tfrac{x}{y} = \log x - \log y" />
          <RuleCard title="Power" tex="\log(x^n) = n\log x" note="brings exponents down: how we solve $b^x = N$" />
          <RuleCard title="Inverse pair" tex="e^{\ln x} = x,\quad \ln(e^x) = x" />
          <RuleCard title="Change of base" tex="\log_b x = \frac{\ln x}{\ln b}" />
          <RuleCard title="Index laws" tex="b^m b^n = b^{m+n},\ (b^m)^n = b^{mn}" note="and $b^0 = 1$, $b^{-n} = \frac{1}{b^n}$" />
          <RuleCard title="No rule for sums!" tex="\log(x + y) \neq \log x + \log y" />
          <RuleCard title="Solve exponentials" tex="b^x = N \Rightarrow x = \frac{\ln N}{\ln b}" />
        </div>
      </Section>

      <Section id="softmax" kicker="AI connection" title="Softmax: exp and log in every classifier">
        <Softmax />
      </Section>

      <MatlabSection topic="explog" />

      <Section id="practice" kicker="Practice" title="Exponential & log drills">
        <Quiz id="w3-explog-quiz" title="Exp & Log Drills" blurb="Evaluate logs, solve exponential equations, use the log laws, doubling times and softmax." gens={FOUND_GENS.explog} />
      </Section>
    </>
  );
}
