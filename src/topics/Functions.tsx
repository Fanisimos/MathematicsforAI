import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { C, Curve, Dot, Handle, Plot, Seg, TextAt, usePlot } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, RuleCard, Section, Slider, Stat, Tabs } from '../components/UI';
import { easeInOut, fmt, randInt, tween, type Fn } from '../lib/math';
import { MatlabSection } from '../matlab/MatlabSection';
import { FOUND_GENS } from './gens_found';

/* ── 1. Mapping builder ─────────────────────────────────── */
const SIZES = [
  { key: '34', label: '3 → 4', m: 3, n: 4 },
  { key: '44', label: '4 → 4', m: 4, n: 4 },
  { key: '43', label: '4 → 3', m: 4, n: 3 },
];

function MappingBuilder() {
  const [sk, setSk] = useState('44');
  const S = SIZES.find((s) => s.key === sk)!;
  const [map, setMap] = useState<(number | null)[]>([0, 2, 1, null]);
  const [sel, setSel] = useState<number | null>(3);
  const [showInv, setShowInv] = useState(false);
  useEffect(() => {
    setMap(Array(S.m).fill(null));
    setSel(0);
    setShowInv(false);
  }, [sk]); // eslint-disable-line react-hooks/exhaustive-deps

  const W = 520, H = 320;
  const yOf = (i: number, k: number) => 60 + (i * 200) / Math.max(1, k - 1);
  const isFn = map.every((v) => v !== null);
  const hits = map.filter((v): v is number => v !== null);
  const inj = new Set(hits).size === hits.length;
  const surj = new Set(hits).size === S.n;
  const bij = isFn && inj && surj;
  const random = () => {
    setMap(Array.from({ length: S.m }, () => randInt(0, S.n - 1)));
    setSel(null);
    setShowInv(false);
  };
  const assign = (j: number) => {
    if (sel === null) return;
    const next = [...map];
    next[sel] = j;
    setMap(next);
    const nextEmpty = next.findIndex((v) => v === null);
    setSel(nextEmpty >= 0 ? nextEmpty : null);
    setShowInv(false);
  };
  const badge = (ok: boolean, label: string) => <span className={`badge ${ok ? 'yes' : 'no'}`}>{ok ? '✓' : '✗'} {label}</span>;

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={sk} onChange={setSk} options={SIZES.map((s) => ({ value: s.key, label: s.label }))} />
        <svg viewBox={`0 0 ${W} ${H}`} className="plot mapping" role="img" aria-label="Mapping diagram builder">
          <defs>
            <marker id="mapHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="#fbbf24" />
            </marker>
            <marker id="mapHeadInv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="#34d399" />
            </marker>
          </defs>
          <ellipse cx={110} cy={160} rx={62} ry={140} className="map-oval" />
          <ellipse cx={410} cy={160} rx={62} ry={140} className="map-oval" />
          <text x={110} y={14} textAnchor="middle" className="map-cap">domain X</text>
          <text x={410} y={14} textAnchor="middle" className="map-cap">codomain Y</text>
          {map.map((j, i) =>
            j === null ? null : (
              <motion.line
                key={`${i}-${j}-${showInv}`}
                x1={showInv ? 390 : 130}
                y1={showInv ? yOf(j, S.n) : yOf(i, S.m)}
                x2={showInv ? 130 : 390}
                y2={showInv ? yOf(i, S.m) : yOf(j, S.n)}
                className={`map-arrow ${showInv ? 'inv' : ''}`}
                markerEnd={showInv ? 'url(#mapHeadInv)' : 'url(#mapHead)'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            ),
          )}
          {Array.from({ length: S.m }, (_, i) => (
            <g key={`d${i}`} className="map-node" onClick={() => setSel(i)}>
              <circle cx={110} cy={yOf(i, S.m)} r={22} className={`map-dot ${sel === i ? 'sel' : ''} ${map[i] === null ? 'empty' : ''}`} />
              <text x={110} y={yOf(i, S.m) + 6} textAnchor="middle" className="map-el">{i + 1}</text>
            </g>
          ))}
          {Array.from({ length: S.n }, (_, j) => (
            <g key={`c${j}`} className="map-node" onClick={() => assign(j)}>
              <circle cx={410} cy={yOf(j, S.n)} r={22} className={`map-dot ${hits.includes(j) ? 'hit' : ''} ${sel !== null ? 'target' : ''}`} />
              <text x={410} y={yOf(j, S.n) + 6} textAnchor="middle" className="map-el">{'abcd'[j]}</text>
            </g>
          ))}
        </svg>
        <p className="plot-caption">Click a number on the left, then a letter on the right to draw its arrow. Green letters = the range.</p>
      </div>
      <div className="explore-side">
        <div className="badges">
          {badge(isFn, 'Function')}
          {badge(isFn && inj, 'Injective')}
          {badge(isFn && surj, 'Surjective')}
          {badge(bij, 'Bijective')}
        </div>
        <p className="muted small">
          {!isFn
            ? 'Not a function yet: every element of X needs exactly one arrow.'
            : !inj
              ? 'Not injective: two inputs share an output.'
              : !surj
                ? 'Not surjective: some letter in Y is never hit.'
                : 'Bijective: a perfect one-to-one pairing, so it can be reversed.'}
        </p>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={random}>🎲 Random</button>
          <button className="btn btn-primary" disabled={!bij} onClick={() => setShowInv(!showInv)}>
            {showInv ? 'Show f' : 'Reverse it: f⁻¹'}
          </button>
        </div>
        <Callout tone="info" icon="💡">
          <MathText>{`Try **4 → 3**: it can never be injective (pigeonhole principle). And **3 → 4** can never be surjective.`}</MathText>
        </Callout>
        <Callout tone="ai" icon="🧠">
          <MathText>A classifier is a function from inputs (images) to labels. Many images map to "cat", so it's **not injective**, and that's fine.</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Composition ──────────────────────────────────────── */
const FS: { key: string; label: string; tex: string; f: Fn }[] = [
  { key: 'sq', label: '$x^2$', tex: 'x^2', f: (x) => x * x },
  { key: 'lin', label: '$2x+1$', tex: '2x+1', f: (x) => 2 * x + 1 },
  { key: 'sin', label: '$\\sin x$', tex: '\\sin x', f: Math.sin },
  { key: 'relu', label: 'ReLU', tex: '\\max(0, x)', f: (x) => Math.max(0, x) },
  { key: 'half', label: '$x/2 - 1$', tex: '\\tfrac{x}{2} - 1', f: (x) => x / 2 - 1 },
];

function Composition() {
  const [fk, setFk] = useState('sq');
  const [gk, setGk] = useState('lin');
  const [x, setX] = useState(1);
  const f = FS.find((d) => d.key === fk)!, g = FS.find((d) => d.key === gk)!;
  const fg = (t: number) => f.f(g.f(t));
  const gf = (t: number) => g.f(f.f(t));
  return (
    <div className="explore">
      <div className="explore-plot">
        <Plot view={{ xMin: -3, xMax: 3, yMin: -4, yMax: 8 }} height={320} onScrub={(nx) => setX(nx)} ariaLabel="Composition of functions">
          <Curve f={f.f} color={C.curve} width={2} opacity={0.6} />
          <Curve f={g.f} color={C.curve2} width={2} opacity={0.6} />
          <Curve f={fg} color={C.tangent} width={3.5} />
          <Curve f={gf} color={C.secant} width={2.5} dashed />
          <Dot x={x} y={fg(x)} color={C.tangent} />
          <Dot x={x} y={gf(x)} color={C.secant} />
        </Plot>
        <div className="legend-row">
          <span style={{ color: C.curve }}>— f</span>
          <span style={{ color: C.curve2 }}>— g</span>
          <span style={{ color: C.tangent }}>━ f∘g</span>
          <span style={{ color: C.secant }}>┅ g∘f</span>
        </div>
      </div>
      <div className="explore-side">
        <div className="pick-row">
          <span className="mono">f =</span>
          <Tabs small value={fk} onChange={setFk} options={FS.map((d) => ({ value: d.key, label: d.label }))} />
        </div>
        <div className="pick-row">
          <span className="mono">g =</span>
          <Tabs small value={gk} onChange={setGk} options={FS.map((d) => ({ value: d.key, label: d.label }))} />
        </div>
        <Slider label="$x$" value={x} min={-3} max={3} step={0.01} onChange={setX} />
        <div className="pipeline mono">
          <span>{fmt(x)}</span>→<span className="pg">g</span>→<span>{fmt(g.f(x))}</span>→<span className="pf">f</span>→<strong>{fmt(fg(x))}</strong>
        </div>
        <Tex block>{`(f\\circ g)(x) = f(g(x)) = ${fmt(fg(x))}, \\qquad (g\\circ f)(x) = ${fmt(gf(x))}`}</Tex>
        <Callout tone={Math.abs(fg(x) - gf(x)) > 1e-9 ? 'warn' : 'good'} icon="🔁">
          <MathText>{`Order matters: $f\\circ g$ means **g first, then f**. In general $f\\circ g \\neq g\\circ f$. A deep neural network is just a long composition $f_n \\circ \\dots \\circ f_2 \\circ f_1$.`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 3. Inverse functions ────────────────────────────────── */
const INV = [
  { key: 'lin', label: '$2x+1$', f: (x: number) => 2 * x + 1, inv: '\\tfrac{x-1}{2}', from: -3, to: 2.5 },
  { key: 'cube', label: '$x^3$', f: (x: number) => x ** 3, inv: '\\sqrt[3]{x}', from: -1.7, to: 1.7 },
  { key: 'exp', label: '$e^x$', f: Math.exp, inv: '\\ln x', from: -4, to: 1.6 },
  { key: 'sq', label: '$x^2$ (all x)', f: (x: number) => x * x, inv: '\\text{none!}', from: -2.2, to: 2.2 },
  { key: 'sqp', label: '$x^2,\\ x \\ge 0$', f: (x: number) => x * x, inv: '\\sqrt{x}', from: 0, to: 2.2 },
];

function ParamPath({ pts, color, width = 3 }: { pts: [number, number][]; color: string; width?: number }) {
  const { sx, sy } = usePlot();
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join('');
  return <path d={d} fill="none" style={{ stroke: color }} strokeWidth={width} strokeLinecap="round" />;
}

function InverseExplorer() {
  const [k, setK] = useState('exp');
  const D = INV.find((d) => d.key === k)!;
  const [t, setT] = useState(0);
  const [hy, setHy] = useState(1.5);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => {
    setT(0);
    return () => cancel.current();
  }, [k]);
  const N = 160;
  const base: [number, number][] = Array.from({ length: N + 1 }, (_, i) => {
    const x = D.from + ((D.to - D.from) * i) / N;
    return [x, D.f(x)];
  });
  const morph = base.map(([x, y]) => [x + (y - x) * t, y + (x - y) * t] as [number, number]);
  const reflected = base.map(([x, y]) => [y, x] as [number, number]);
  const hits = base.filter((p, i) => i > 0 && (base[i - 1][1] - hy) * (p[1] - hy) <= 0).length;
  const flip = () => {
    const s = t, e = t < 0.5 ? 1 : 0;
    cancel.current = tween(1200, (p) => setT(s + (e - s) * easeInOut(p)));
  };
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={k} onChange={setK} options={INV.map((d) => ({ value: d.key, label: d.label }))} />
        <Plot view={{ xMin: -4, xMax: 5, yMin: -4, yMax: 5 }} width={412} height={398} ariaLabel="Function and its reflection in y = x">
          <Seg x1={-10} y1={-10} x2={10} y2={10} color={C.muted} dashed width={1.5} />
          <TextAt x={4.2} y={4.6} color={C.muted} anchor="end">y = x</TextAt>
          <ParamPath pts={base} color={C.curve} width={2.5} />
          {t > 0 && <ParamPath pts={t >= 1 ? reflected : morph} color={C.tangent} />}
          <Seg x1={-10} y1={hy} x2={10} y2={hy} color={hits > 1 ? C.bad : C.good} width={2} />
          <Handle x={-3.4} y={hy} lockX onDrag={(_, y) => setHy(y)} color={hits > 1 ? C.bad : C.good} r={7} />
        </Plot>
        <p className="plot-caption">Drag the horizontal line up and down: that's the horizontal line test</p>
      </div>
      <div className="explore-side">
        <button className="btn btn-primary" onClick={flip}>{t < 0.5 ? 'Reflect in y = x ↗' : 'Reflect back'}</button>
        <Stat label="crossings of horizontal line" value={hits} tone={hits > 1 ? 'bad' : 'good'} />
        <Tex block>{`f^{-1}(x) = ${D.inv}`}</Tex>
        <Callout tone={k === 'sq' ? 'warn' : 'info'} icon={k === 'sq' ? '⚠️' : '🪞'}>
          <MathText>
            {k === 'sq'
              ? 'Some horizontal lines hit $x^2$ **twice** (e.g. $2^2 = (-2)^2$), so it is not injective and has no inverse. Fix: restrict the domain to $x \\ge 0$ (next tab).'
              : 'Swapping $x$ and $y$ = reflecting the graph in $y = x$. If every horizontal line hits the graph at most once, the inverse exists.'}
          </MathText>
        </Callout>
      </div>
    </div>
  );
}

export default function Functions() {
  return (
    <>
      <Section id="mapping" kicker="Mappings" title="Build a function" intro="A **function** $f: X \to Y$ assigns to **every** input in the domain $X$ **exactly one** output in the codomain $Y$. Draw the arrows and the app checks the properties live.">
        <MappingBuilder />
      </Section>

      <Section id="compose" kicker="Composition" title="Functions inside functions" intro="Feed the output of one function into another. Drag on the graph or use the slider.">
        <Composition />
      </Section>

      <Section id="inverse" kicker="Inverses" title="Undoing a function">
        <InverseExplorer />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Vocabulary">
        <div className="rules-grid">
          <RuleCard title="Function" tex="f: X \to Y" note="every $x$ has exactly one image $f(x)$" />
          <RuleCard title="Range (image)" tex="f(X) = \{ f(x) : x \in X \}" note="what actually gets hit, a subset of the codomain" />
          <RuleCard title="Injective" tex="f(a) = f(b) \Rightarrow a = b" note="one-to-one: no sharing outputs" />
          <RuleCard title="Surjective" tex="\forall y \in Y\ \exists x: f(x) = y" note="onto: every output is hit" />
          <RuleCard title="Bijective" tex="\text{injective} + \text{surjective}" note="exactly when $f^{-1}$ exists" />
          <RuleCard title="Composition" tex="(f \circ g)(x) = f(g(x))" note="right-hand function first" />
          <RuleCard title="Inverse" tex="f^{-1}(f(x)) = x" note="$f^{-1} \neq \frac1f$!" />
          <RuleCard title="Vertical line test" tex="\text{graph is a function}" note="every vertical line hits it at most once" />
        </div>
      </Section>

      <MatlabSection topic="functions" />

      <Section id="practice" kicker="Practice" title="Function drills">
        <Quiz id="w2-func-quiz" title="Function Drills" blurb="Classify mappings, compose functions, find inverses and domains." gens={FOUND_GENS.functions} />
      </Section>
    </>
  );
}
