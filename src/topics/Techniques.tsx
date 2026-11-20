import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { AreaFill, C, Curve, Plot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, RuleCard, Section, Stat, Tabs } from '../components/UI';
import { fmt, simpson, type Fn } from '../lib/math';
import { addXp } from '../lib/progress';
import { ALL_GENS } from './gens';
import { autoView } from './shared';

type Opt = { tex: string; correct?: boolean; feedback: string };
type Path = {
  key: string;
  label: string;
  integral: string;
  question: string;
  options: Opt[];
  steps: { tex: string; note: string }[];
  check: { f: Fn; F: Fn; a: number; b: number; Ftex: string };
};

const SUBS: Path[] = [
  {
    key: 'cos',
    label: '$\\int 2x\\cos(x^2)$',
    integral: '\\int 2x\\cos(x^2)\\,dx',
    question: 'Which substitution turns this into something easy?',
    options: [
      { tex: 'u = x^2', correct: true, feedback: 'Its derivative $2x$ is sitting right there as a factor.' },
      { tex: 'u = \\cos(x^2)', feedback: '$du = -2x\\sin(x^2)\\,dx$: there is no $\\sin(x^2)$ in the integral to cancel it.' },
      { tex: 'u = 2x', feedback: '$du = 2\\,dx$, but the awkward $\\cos(x^2)$ is still there in terms of $x$.' },
    ],
    steps: [
      { tex: 'u = x^2 \\;\\Rightarrow\\; \\frac{du}{dx} = 2x \\;\\Rightarrow\\; du = 2x\\,dx', note: 'Differentiate your $u$' },
      { tex: '\\int \\cos(\\underbrace{x^2}_{u})\\,\\underbrace{2x\\,dx}_{du} = \\int \\cos u\\,du', note: 'Swap every $x$ for $u$' },
      { tex: '= \\sin u + C', note: 'Standard integral' },
      { tex: '= \\sin(x^2) + C', note: 'Put $x$ back' },
    ],
    check: { f: (x) => 2 * x * Math.cos(x * x), F: (x) => Math.sin(x * x), a: 0, b: 1.5, Ftex: '\\sin(x^2)' },
  },
  {
    key: 'pow',
    label: '$\\int x(x^2+1)^4$',
    integral: '\\int x\\,(x^2+1)^4\\,dx',
    question: 'Pick your u:',
    options: [
      { tex: 'u = x^2 + 1', correct: true, feedback: '$du = 2x\\,dx$, and we have an $x\\,dx$. Only a factor of 2 off, which is fine.' },
      { tex: 'u = x', feedback: 'That changes nothing: you would still have to expand $(x^2+1)^4$.' },
      { tex: 'u = (x^2+1)^4', feedback: '$du = 8x(x^2+1)^3\\,dx$, way messier than what we started with.' },
    ],
    steps: [
      { tex: 'u = x^2+1 \\;\\Rightarrow\\; du = 2x\\,dx \\;\\Rightarrow\\; x\\,dx = \\tfrac12\\,du', note: 'Solve for the piece you have' },
      { tex: '\\int u^4\\cdot\\tfrac12\\,du', note: 'Substitute' },
      { tex: '= \\tfrac12\\cdot\\frac{u^5}{5} + C = \\frac{u^5}{10} + C', note: 'Reverse power rule' },
      { tex: '= \\frac{(x^2+1)^5}{10} + C', note: 'Back to $x$' },
    ],
    check: { f: (x) => x * (x * x + 1) ** 4, F: (x) => (x * x + 1) ** 5 / 10, a: 0, b: 1, Ftex: '\\tfrac{(x^2+1)^5}{10}' },
  },
  {
    key: 'exp',
    label: '$\\int e^{3x}$',
    integral: '\\int e^{3x}\\,dx',
    question: 'Simplest substitution?',
    options: [
      { tex: 'u = 3x', correct: true, feedback: 'Linear inside = easiest possible substitution.' },
      { tex: 'u = e^{x}', feedback: 'Possible, but then $e^{3x} = u^3$ and $dx = du/u$: more work than needed.' },
      { tex: 'u = x', feedback: 'That is just renaming $x$.' },
    ],
    steps: [
      { tex: 'u = 3x \\;\\Rightarrow\\; du = 3\\,dx \\;\\Rightarrow\\; dx = \\tfrac13\\,du', note: '' },
      { tex: '\\int e^{u}\\cdot\\tfrac13\\,du = \\tfrac13 e^{u} + C', note: '$e^u$ integrates to itself' },
      { tex: '= \\tfrac13 e^{3x} + C', note: 'Shortcut: $\\int e^{kx}dx = \\frac1k e^{kx} + C$' },
    ],
    check: { f: (x) => Math.exp(3 * x), F: (x) => Math.exp(3 * x) / 3, a: 0, b: 0.8, Ftex: '\\tfrac13e^{3x}' },
  },
];

const PARTS: Path[] = [
  {
    key: 'xex',
    label: '$\\int xe^x$',
    integral: '\\int x\\,e^{x}\\,dx',
    question: 'Choose $u$ and $dv$:',
    options: [
      { tex: 'u = x,\\; dv = e^{x}dx', correct: true, feedback: '$x$ simplifies to 1 when differentiated, and $e^x$ is easy to integrate.' },
      { tex: 'u = e^{x},\\; dv = x\\,dx', feedback: 'Then $v = \\frac{x^2}{2}$ and the new integral $\\int \\frac{x^2}{2}e^x dx$ is **harder** than the original!' },
    ],
    steps: [
      { tex: 'u = x \\Rightarrow du = dx, \\qquad dv = e^x dx \\Rightarrow v = e^x', note: 'Differentiate $u$, integrate $dv$' },
      { tex: '\\int u\\,dv = uv - \\int v\\,du = xe^x - \\int e^x\\,dx', note: 'Plug into the formula' },
      { tex: '= xe^x - e^x + C', note: 'The leftover integral is easy' },
    ],
    check: { f: (x) => x * Math.exp(x), F: (x) => x * Math.exp(x) - Math.exp(x), a: 0, b: 2, Ftex: 'xe^x - e^x' },
  },
  {
    key: 'xcos',
    label: '$\\int x\\cos x$',
    integral: '\\int x\\cos x\\,dx',
    question: 'Choose $u$ and $dv$:',
    options: [
      { tex: 'u = x,\\; dv = \\cos x\\,dx', correct: true, feedback: 'Algebraic before Trig in LIATE.' },
      { tex: 'u = \\cos x,\\; dv = x\\,dx', feedback: 'You get $\\int \\frac{x^2}{2}\\sin x\\,dx$, and the power of $x$ went **up**.' },
    ],
    steps: [
      { tex: 'u = x \\Rightarrow du = dx, \\qquad dv = \\cos x\\,dx \\Rightarrow v = \\sin x', note: '' },
      { tex: '= x\\sin x - \\int \\sin x\\,dx', note: '$uv - \\int v\\,du$' },
      { tex: '= x\\sin x + \\cos x + C', note: 'Since $\\int \\sin x\\,dx = -\\cos x$' },
    ],
    check: { f: (x) => x * Math.cos(x), F: (x) => x * Math.sin(x) + Math.cos(x), a: 0, b: 3, Ftex: 'x\\sin x + \\cos x' },
  },
  {
    key: 'ln',
    label: '$\\int \\ln x$',
    integral: '\\int \\ln x\\,dx',
    question: 'There is only one function here… so what are $u$ and $dv$?',
    options: [
      { tex: 'u = \\ln x,\\; dv = 1\\,dx', correct: true, feedback: 'The classic trick: multiply by 1 and integrate the 1.' },
      { tex: 'u = 1,\\; dv = \\ln x\\,dx', feedback: 'To find $v$ you would need $\\int \\ln x\\,dx$, which is the very thing we are trying to find!' },
    ],
    steps: [
      { tex: 'u = \\ln x \\Rightarrow du = \\tfrac1x dx, \\qquad dv = dx \\Rightarrow v = x', note: '' },
      { tex: '= x\\ln x - \\int x\\cdot\\tfrac1x\\,dx = x\\ln x - \\int 1\\,dx', note: 'The $x$s cancel' },
      { tex: '= x\\ln x - x + C', note: '' },
    ],
    check: { f: Math.log, F: (x) => x * Math.log(x) - x, a: 1, b: 3, Ftex: 'x\\ln x - x' },
  },
];

function PathStepper({ paths, xpKey }: { paths: Path[]; xpKey: string }) {
  const [k, setK] = useState(paths[0].key);
  const P = paths.find((p) => p.key === k)!;
  const [wrong, setWrong] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [shown, setShown] = useState(0);
  const [rewarded, setRewarded] = useState<Set<string>>(new Set());

  const switchTo = (key: string) => {
    setK(key);
    setWrong(null);
    setSolved(false);
    setShown(0);
  };
  const choose = (i: number) => {
    if (solved) return;
    if (P.options[i].correct) {
      setSolved(true);
      setWrong(null);
      setShown(1);
      if (!rewarded.has(`${xpKey}-${P.key}`)) {
        addXp(10);
        setRewarded(new Set(rewarded).add(`${xpKey}-${P.key}`));
      }
    } else setWrong(i);
  };
  const { f, F, a, b, Ftex } = P.check;
  const numeric = simpson(f, a, b);
  const formula = F(b) - F(a);
  const done = solved && shown >= P.steps.length;

  return (
    <Card className="stepper">
      <Tabs small value={k} onChange={switchTo} options={paths.map((p) => ({ value: p.key, label: p.label }))} />
      <div className="stepper-integral">
        <Tex block>{P.integral}</Tex>
      </div>
      <p className="stepper-q">
        <MathText>{P.question}</MathText>
      </p>
      <div className="choices">
        {P.options.map((o, i) => (
          <motion.button
            key={`${k}-${i}`}
            className={`choice ${solved && o.correct ? 'correct' : wrong === i ? 'wrong' : solved ? 'dim' : ''}`}
            onClick={() => choose(i)}
            animate={wrong === i ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            whileTap={{ scale: 0.97 }}
          >
            <Tex>{o.tex}</Tex>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {wrong !== null && !solved && (
          <motion.div key={`w${wrong}`} className="feedback bad" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <strong>Try again.</strong> <MathText>{P.options[wrong].feedback}</MathText>
          </motion.div>
        )}
      </AnimatePresence>
      {solved && (
        <div className="steps">
          <div className="feedback good">
            <strong>Good choice!</strong> <MathText>{P.options.find((o) => o.correct)!.feedback}</MathText>
          </div>
          {P.steps.slice(0, shown).map((s, i) => (
            <motion.div key={i} className="step-line" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
              <span className="step-num mono">{i + 1}</span>
              <Tex>{s.tex}</Tex>
              {s.note && (
                <span className="step-note">
                  <MathText>{s.note}</MathText>
                </span>
              )}
            </motion.div>
          ))}
          {shown < P.steps.length && (
            <button className="btn btn-primary" onClick={() => setShown((n) => n + 1)}>
              Next step →
            </button>
          )}
        </div>
      )}
      {done && (
        <motion.div className="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="explore">
            <div className="explore-plot">
              <Plot view={autoView(f, a - 0.3, b + 0.3, 0.15, 30)} height={220} ariaLabel="Numerical verification of the integral">
                <AreaFill f={f} from={a} to={b} color={C.good} opacity={0.35} />
                <Curve f={f} />
              </Plot>
            </div>
            <div className="explore-side">
              <span className="kicker">Sanity check</span>
              <div className="stat-row">
                <Stat label="Area by computer" value={fmt(numeric, 5)} tone="accent" />
                <Stat label={`$F(${fmt(b)}) - F(${fmt(a)})$`} value={fmt(formula, 5)} tone="good" />
              </div>
              <p className="muted small">
                <MathText>{`Using $F(x) = ${Ftex}$. They match ✓, so our antiderivative is right. You can do this check in MATLAB with \`integral\`.`}</MathText>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

export default function Techniques() {
  return (
    <>
      <Section id="sub" kicker="Technique 1" title="Integration by substitution" intro="The chain rule, run backwards. Spot an inside function $u$ whose derivative is also hanging around, then rewrite everything in $u$.">
        <PathStepper paths={SUBS} xpKey="sub" />
      </Section>

      <Section id="parts" kicker="Technique 2" title="Integration by parts" intro="The product rule, run backwards. Use it when two different kinds of function are multiplied together.">
        <div className="rules-grid two">
          <RuleCard title="By parts formula" tex="\int u\,dv = uv - \int v\,du" note="Pick $u$ = the thing that gets simpler when differentiated" />
          <RuleCard title="LIATE: who gets to be u?" tex="\text{Log} \succ \text{Inv trig} \succ \text{Algebraic} \succ \text{Trig} \succ \text{Exp}" note="Earlier in the list → choose as $u$" />
        </div>
        <PathStepper paths={PARTS} xpKey="parts" />
      </Section>

      <Section id="which" kicker="Strategy" title="Which technique?">
        <div className="steps-grid">
          {[
            ['🔍', 'Standard form?', 'Polynomial, $e^{kx}$, $\\sin$, $\\cos$, $\\frac1x$: just use the rules.'],
            ['🪆', 'Function inside a function?', 'And the inner derivative appears as a factor → **substitution**.'],
            ['✖️', 'Product of two types?', '$x\\cdot e^x$, $x\\cdot\\cos x$, $x^n \\ln x$ → **by parts** (use LIATE).'],
            ['✅', 'Always', 'Differentiate your answer to check it gives the integrand back.'],
          ].map(([icon, t, body]) => (
            <motion.div key={t} className="step-card" whileHover={{ y: -4 }}>
              <span className="step-num">{icon}</span>
              <strong>{t}</strong>
              <p>
                <MathText>{body}</MathText>
              </p>
            </motion.div>
          ))}
        </div>
        <Callout tone="warn" icon="⚠️">
          <MathText>{`**Definite integrals + substitution:** either change the limits to $u$-values, or substitute back to $x$ before plugging in. Mixing the two is the most common lost mark.`}</MathText>
        </Callout>
      </Section>

      <Section id="practice" kicker="Practice" title="Technique drills">
        <Quiz id="w11-quiz" title="Substitution & Parts" blurb="Choose substitutions, pick $u$ for by parts, and evaluate integrals." gens={ALL_GENS.techniques} />
      </Section>
    </>
  );
}
