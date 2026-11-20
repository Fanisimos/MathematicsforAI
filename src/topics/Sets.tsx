import { AnimatePresence, motion } from 'framer-motion';
import { useId, useMemo, useRef, useState } from 'react';
import { toSvg } from '../components/Plot';
import { Quiz } from '../components/Quiz';
import { MathText, Tex } from '../components/Tex';
import { Callout, Card, Confetti, RuleCard, Section, Stat, Tabs } from '../components/UI';
import { shuffle } from '../lib/math';
import { addXp, recordBest } from '../lib/progress';
import { MatlabSection } from '../matlab/MatlabSection';
import { FOUND_GENS } from './gens_found';

/* ── Venn geometry helpers ───────────────────────────────── */
type Circ = { cx: number; cy: number; r: number };
const inC = (c: Circ, x: number, y: number) => (x - c.cx) ** 2 + (y - c.cy) ** 2 <= c.r * c.r;

/** Shade one region of a Venn diagram given which circles it is inside/outside of. */
function RegionShape({ circles, bits, ids, fill, opacity = 0.55, W, H }: { circles: Circ[]; bits: boolean[]; ids: string; fill: string; opacity?: number; W: number; H: number }) {
  let node = <rect x={10} y={10} width={W - 20} height={H - 20} rx={14} style={{ fill, opacity }} />;
  bits.forEach((inside, k) => {
    node = inside ? <g clipPath={`url(#${ids}-c${k})`}>{node}</g> : <g mask={`url(#${ids}-m${k})`}>{node}</g>;
  });
  return node;
}

function VennDefs({ circles, ids, W, H }: { circles: Circ[]; ids: string; W: number; H: number }) {
  return (
    <defs>
      {circles.map((c, k) => (
        <g key={k}>
          <clipPath id={`${ids}-c${k}`}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
          <mask id={`${ids}-m${k}`}>
            <rect width={W} height={H} fill="white" />
            <circle cx={c.cx} cy={c.cy} r={c.r} fill="black" />
          </mask>
        </g>
      ))}
    </defs>
  );
}

/** Find free slots inside a region (grid points away from circle edges). */
function slotsFor(circles: Circ[], bits: boolean[], W: number, H: number) {
  const pts: { x: number; y: number }[] = [];
  for (let y = 34; y < H - 20; y += 26)
    for (let x = 30; x < W - 20; x += 30) {
      const ok = circles.every((c, k) => {
        const d = Math.hypot(x - c.cx, y - c.cy);
        return bits[k] ? d < c.r - 14 : d > c.r + 14;
      });
      if (ok) pts.push({ x, y });
    }
  const cx = pts.reduce((s, p) => s + p.x, 0) / (pts.length || 1);
  const cy = pts.reduce((s, p) => s + p.y, 0) / (pts.length || 1);
  return pts.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
}

const setTex = (xs: number[]) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\varnothing');

/* ── 1. Two-set explorer ────────────────────────────────── */
const U = Array.from({ length: 20 }, (_, i) => i + 1);
const isPrime = (n: number) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d);
const PRESETS = [
  { key: 'even3', label: 'Even & multiples of 3', A: (n: number) => n % 2 === 0, B: (n: number) => n % 3 === 0, aName: 'even', bName: 'multiple of 3' },
  { key: 'prime', label: 'Primes & odd', A: isPrime, B: (n: number) => n % 2 === 1, aName: 'prime', bName: 'odd' },
  { key: 'sq', label: 'Squares & even', A: (n: number) => [1, 4, 9, 16].includes(n), B: (n: number) => n % 2 === 0, aName: 'square', bName: 'even' },
];
const OPS = [
  { key: 'union', label: '$A \\cup B$', f: (a: boolean, b: boolean) => a || b, words: 'in A **or** B (or both)' },
  { key: 'inter', label: '$A \\cap B$', f: (a: boolean, b: boolean) => a && b, words: 'in A **and** B' },
  { key: 'amb', label: '$A \\setminus B$', f: (a: boolean, b: boolean) => a && !b, words: 'in A but **not** B' },
  { key: 'bma', label: '$B \\setminus A$', f: (a: boolean, b: boolean) => b && !a, words: 'in B but **not** A' },
  { key: 'ac', label: "$A^{c}$", f: (a: boolean) => !a, words: '**not** in A' },
  { key: 'sym', label: '$A \\triangle B$', f: (a: boolean, b: boolean) => a !== b, words: 'in exactly **one** of them' },
  { key: 'none', label: '$(A \\cup B)^{c}$', f: (a: boolean, b: boolean) => !(a || b), words: 'in **neither**' },
];

function VennExplorer() {
  const ids = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [pk, setPk] = useState('even3');
  const [ok, setOk] = useState('union');
  const P = PRESETS.find((p) => p.key === pk)!;
  const O = OPS.find((o) => o.key === ok)!;
  const W = 500, H = 330;
  const circles: Circ[] = [{ cx: 195, cy: 170, r: 118 }, { cx: 305, cy: 170, r: 118 }];
  const regions: [boolean, boolean][] = [[true, false], [true, true], [false, true], [false, false]];
  const placed = useMemo(() => {
    const out: { n: number; x: number; y: number }[] = [];
    regions.forEach((bits) => {
      const members = U.filter((n) => P.A(n) === bits[0] && P.B(n) === bits[1]);
      const slots = slotsFor(circles, bits, W, H);
      members.forEach((n, i) => slots[i] && out.push({ n, ...slots[i] }));
    });
    return out;
  }, [pk]); // eslint-disable-line react-hooks/exhaustive-deps
  const A = U.filter(P.A), B = U.filter(P.B);
  const AB = U.filter((n) => P.A(n) && P.B(n));
  const result = U.filter((n) => O.f(P.A(n), P.B(n)));

  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={pk} onChange={setPk} options={PRESETS.map((p) => ({ value: p.key, label: p.label }))} />
        <svg viewBox={`0 0 ${W} ${H}`} className="plot venn" role="img" aria-label="Venn diagram">
          <VennDefs circles={circles} ids={ids} W={W} H={H} />
          <rect x={10} y={10} width={W - 20} height={H - 20} rx={14} className="venn-u" />
          {regions.map((bits, i) => (
            <motion.g key={i} animate={{ opacity: O.f(bits[0], bits[1]) ? 1 : 0 }} transition={{ duration: 0.35 }}>
              <RegionShape circles={circles} bits={bits} ids={ids} fill="#7c5cff" W={W} H={H} />
            </motion.g>
          ))}
          {circles.map((c, k) => (
            <circle key={k} cx={c.cx} cy={c.cy} r={c.r} className="venn-c" style={{ stroke: k ? '#22d3ee' : '#f472b6' }} />
          ))}
          <text x={100} y={52} className="venn-label" style={{ fill: '#f472b6' }}>A</text>
          <text x={392} y={52} className="venn-label" style={{ fill: '#22d3ee' }}>B</text>
          <text x={24} y={32} className="venn-label small">U</text>
          {placed.map((p) => (
            <text key={p.n} x={p.x} y={p.y + 5} textAnchor="middle" className={`venn-num ${O.f(P.A(p.n), P.B(p.n)) ? 'on' : ''}`}>
              {p.n}
            </text>
          ))}
        </svg>
        <p className="plot-caption">
          U = {'{'}1, …, 20{'}'} · A = {P.aName} numbers · B = {P.bName} numbers
        </p>
      </div>
      <div className="explore-side">
        <Tabs small value={ok} onChange={setOk} options={OPS.map((o) => ({ value: o.key, label: o.label }))} />
        <p className="muted">
          <MathText>{`${O.label} = everything ${O.words}.`}</MathText>
        </p>
        <Tex block>{`${O.label.slice(1, -1)} = ${setTex(result)}`}</Tex>
        <div className="stat-row">
          <Stat label="$|A|$" value={A.length} />
          <Stat label="$|B|$" value={B.length} />
          <Stat label="$|A \cap B|$" value={AB.length} />
          <Stat label="result size" value={result.length} tone="accent" />
        </div>
        <Callout tone="info" icon="🧮">
          <MathText>{`**Inclusion–exclusion:** $|A \\cup B| = |A| + |B| - |A \\cap B| = ${A.length} + ${B.length} - ${AB.length} = ${A.length + B.length - AB.length}$. Subtract the overlap because it was counted twice.`}</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 2. Game: Shade the expression (3 sets) ─────────────── */
type Expr = { tex: string; f: (a: boolean, b: boolean, c: boolean) => boolean };
const EXPRS: Expr[] = [
  { tex: 'A \\cap B \\cap C', f: (a, b, c) => a && b && c },
  { tex: 'A \\cup B \\cup C', f: (a, b, c) => a || b || c },
  { tex: '(A \\cup B) \\cap C^{c}', f: (a, b, c) => (a || b) && !c },
  { tex: 'A \\setminus (B \\cup C)', f: (a, b, c) => a && !b && !c },
  { tex: '(A \\cap B) \\cup C', f: (a, b, c) => (a && b) || c },
  { tex: '(A \\cup B \\cup C)^{c}', f: (a, b, c) => !(a || b || c) },
  { tex: '(A \\cap C) \\setminus B', f: (a, b, c) => a && c && !b },
  { tex: 'B \\cap (A \\cup C)', f: (a, b, c) => b && (a || c) },
  { tex: 'A \\triangle B', f: (a, b) => a !== b },
  { tex: 'C^{c} \\cap A', f: (a, _b, c) => a && !c },
  { tex: '(A \\cap B)^{c}', f: (a, b) => !(a && b) },
  { tex: '(A \\cap B) \\cup (B \\cap C) \\cup (A \\cap C)', f: (a, b, c) => (a && b) || (b && c) || (a && c) },
];
const BITS3: [boolean, boolean, boolean][] = [];
for (let k = 0; k < 8; k++) BITS3.push([!!(k & 4), !!(k & 2), !!(k & 1)]);
const ROUNDS = 6;

function ShadeGame() {
  const ids = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const W = 500, H = 340;
  const circles: Circ[] = [{ cx: 200, cy: 132, r: 96 }, { cx: 300, cy: 132, r: 96 }, { cx: 250, cy: 220, r: 96 }];
  const [order, setOrder] = useState(() => shuffle(EXPRS).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const E = order[round];
  const truth = new Set(BITS3.map((b, k) => (E.f(...b) ? k : -1)).filter((k) => k >= 0));

  const click = (e: React.MouseEvent) => {
    if (checked !== null || !svg.current) return;
    const p = toSvg(svg.current, e.clientX, e.clientY);
    if (p.x < 10 || p.x > W - 10 || p.y < 10 || p.y > H - 10) return;
    const bits = circles.map((c) => inC(c, p.x, p.y));
    const k = (bits[0] ? 4 : 0) + (bits[1] ? 2 : 0) + (bits[2] ? 1 : 0);
    const n = new Set(sel);
    n.has(k) ? n.delete(k) : n.add(k);
    setSel(n);
  };
  const check = () => {
    const ok = truth.size === sel.size && [...truth].every((k) => sel.has(k));
    setChecked(ok);
    if (ok) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= ROUNDS) {
      const final = score;
      recordBest('w1-venn', final / ROUNDS);
      addXp(final * 12);
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setSel(new Set());
    setChecked(null);
  };
  const restart = () => {
    setOrder(shuffle(EXPRS).slice(0, ROUNDS));
    setRound(0);
    setScore(0);
    setSel(new Set());
    setChecked(null);
    setDone(false);
  };

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game</span>
          <h3>Shade It</h3>
          <p className="muted">Click the regions of the Venn diagram that make up the expression, then check. Click again to un-shade.</p>
        </div>
        <div className="game-score mono">
          <span>Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</span>
          <strong>{score} ✓</strong>
        </div>
      </div>
      {done ? (
        <div className="quiz-done">
          {score >= 5 && <Confetti />}
          <div className="big-score mono">{score}/{ROUNDS}</div>
          <p className="done-msg">{score === ROUNDS ? 'Flawless set theory. 🏆' : 'Tip: work inside-out. Shade the brackets first, then apply the outer operation.'}</p>
          <button className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div className="explore">
          <div className="explore-plot">
            <div className="shade-target">
              <Tex block>{E.tex}</Tex>
            </div>
            <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="plot venn clickable" onClick={click} role="img" aria-label="Three-set Venn diagram to shade">
              <VennDefs circles={circles} ids={ids} W={W} H={H} />
              <rect x={10} y={10} width={W - 20} height={H - 20} rx={14} className="venn-u" />
              {BITS3.map((bits, k) => (
                <motion.g key={k} animate={{ opacity: sel.has(k) ? 1 : 0 }} transition={{ duration: 0.2 }}>
                  <RegionShape circles={circles} bits={bits} ids={ids} fill={checked === null ? '#7c5cff' : truth.has(k) ? '#34d399' : '#f87171'} W={W} H={H} />
                </motion.g>
              ))}
              {checked !== null &&
                BITS3.map((bits, k) =>
                  truth.has(k) && !sel.has(k) ? (
                    <g key={`m${k}`} className="missed">
                      <RegionShape circles={circles} bits={bits} ids={ids} fill="#34d399" opacity={0.3} W={W} H={H} />
                    </g>
                  ) : null,
                )}
              {circles.map((c, k) => (
                <circle key={k} cx={c.cx} cy={c.cy} r={c.r} className="venn-c" style={{ stroke: ['#f472b6', '#22d3ee', '#fbbf24'][k] }} />
              ))}
              <text x={88} y={66} className="venn-label" style={{ fill: '#f472b6' }}>A</text>
              <text x={398} y={66} className="venn-label" style={{ fill: '#22d3ee' }}>B</text>
              <text x={352} y={318} className="venn-label" style={{ fill: '#fbbf24' }}>C</text>
            </svg>
          </div>
          <div className="explore-side">
            {checked === null ? (
              <button className="btn btn-primary btn-lg" onClick={check} disabled={sel.size === 0 && !truth.size}>
                Check
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`feedback ${checked ? 'good' : 'bad'}`}>
                <strong>{checked ? 'Correct!' : 'Not quite: the faint green regions were missing, red ones should be empty.'}</strong>
                <button className="btn btn-primary" onClick={next}>{round + 1 >= ROUNDS ? 'Finish' : 'Next →'}</button>
              </motion.div>
            )}
            <Callout tone="info" icon="🧭">
              <MathText>{'$\\cup$ = or, $\\cap$ = and, $^{c}$ = not, $\\setminus$ = "but not". Exactly the same as $\\lor, \\land, \\lnot$ in logic.'}</MathText>
            </Callout>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── 3. Number systems sorter ───────────────────────────── */
type NS = 'N' | 'Z' | 'Q' | 'I' | 'C';
const NUMS: { tex: string; s: NS; why: string }[] = [
  { tex: '7', s: 'N', why: 'A counting number.' },
  { tex: '\\sqrt{16}', s: 'N', why: '$\\sqrt{16} = 4$, a counting number in disguise.' },
  { tex: '-3', s: 'Z', why: 'A negative whole number: an integer.' },
  { tex: '-\\sqrt{9}', s: 'Z', why: '$-\\sqrt 9 = -3$.' },
  { tex: '0.75', s: 'Q', why: '$0.75 = \\frac34$, a fraction of integers.' },
  { tex: '-\\tfrac{2}{5}', s: 'Q', why: 'Any $\\frac pq$ with integers $p, q$ ($q \\ne 0$) is rational.' },
  { tex: '0.\\overline{3}', s: 'Q', why: 'Repeating decimals are rational: $0.333\\ldots = \\frac13$.' },
  { tex: '3.14', s: 'Q', why: '$3.14 = \\frac{314}{100}$: rational! (It is not $\\pi$.)' },
  { tex: '\\tfrac{22}{7}', s: 'Q', why: 'A fraction, so rational, even though it is close to $\\pi$.' },
  { tex: '\\sqrt{2}', s: 'I', why: 'Irrational: its decimals never end or repeat (see the proof below).' },
  { tex: '\\pi', s: 'I', why: 'Irrational.' },
  { tex: 'e', s: 'I', why: 'Euler’s number $2.718\\ldots$ is irrational.' },
  { tex: '\\sqrt{3}', s: 'I', why: 'Square roots of non-square integers are irrational.' },
  { tex: 'i', s: 'C', why: '$i = \\sqrt{-1}$ is not on the real number line.' },
  { tex: '2 + 3i', s: 'C', why: 'A complex number with non-zero imaginary part.' },
  { tex: '\\sqrt{-4}', s: 'C', why: '$\\sqrt{-4} = 2i$.' },
];
const SETS: { k: NS; tex: string; name: string }[] = [
  { k: 'N', tex: '\\mathbb{N}', name: 'Natural' },
  { k: 'Z', tex: '\\mathbb{Z}', name: 'Integer' },
  { k: 'Q', tex: '\\mathbb{Q}', name: 'Rational' },
  { k: 'I', tex: '\\mathbb{R}\\setminus\\mathbb{Q}', name: 'Irrational' },
  { k: 'C', tex: '\\mathbb{C}\\setminus\\mathbb{R}', name: 'Non-real complex' },
];
const belongs = (s: NS): NS[] => ({ N: ['N', 'Z', 'Q', 'R', 'C'], Z: ['Z', 'Q', 'R', 'C'], Q: ['Q', 'R', 'C'], I: ['I', 'R', 'C'], C: ['C'] } as Record<NS, string[]>)[s] as NS[];
const SORT_ROUNDS = 8;

function NumberSorter() {
  const [deck, setDeck] = useState(() => shuffle(NUMS).slice(0, SORT_ROUNDS));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<NS | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = deck[i];
  const lit = picked ? belongs(cur.s) : [];
  const choose = (k: NS) => {
    if (picked) return;
    setPicked(k);
    if (k === cur.s) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= SORT_ROUNDS) {
      recordBest('w1-numbers', score / SORT_ROUNDS);
      addXp(score * 8);
      setDone(true);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    setDeck(shuffle(NUMS).slice(0, SORT_ROUNDS));
    setI(0);
    setScore(0);
    setPicked(null);
    setDone(false);
  };
  const ring = (k: string, label: string, tex: string, inset: number) => (
    <div className={`ns-ring ns-${k} ${(lit as string[]).includes(k) ? 'lit' : ''}`} style={{ inset }}>
      <span className="ns-tag">
        <Tex>{tex}</Tex> {label}
      </span>
    </div>
  );

  return (
    <Card className="game">
      <div className="game-head">
        <div>
          <span className="quiz-badge">🎮 Mini-game</span>
          <h3>Number Sorter</h3>
          <p className="muted">Which is the <strong>smallest</strong> set each number belongs to?</p>
        </div>
        <div className="game-score mono">
          <span>{Math.min(i + 1, SORT_ROUNDS)}/{SORT_ROUNDS}</span>
          <strong>{score} ✓</strong>
        </div>
      </div>
      {done ? (
        <div className="quiz-done">
          {score >= 6 && <Confetti />}
          <div className="big-score mono">{score}/{SORT_ROUNDS}</div>
          <button className="btn btn-primary btn-lg" onClick={restart}>Play again</button>
        </div>
      ) : (
        <div className="explore">
          <div className="explore-plot">
            <div className="ns-diagram">
              {ring('C', 'complex', '\\mathbb{C}', 0)}
              {ring('R', 'real', '\\mathbb{R}', 34)}
              <div className={`ns-irr ${(lit as string[]).includes('I') ? 'lit' : ''}`}>
                <Tex>{'\\mathbb{R}\\setminus\\mathbb{Q}'}</Tex>
                <small>irrational</small>
              </div>
              <div className="ns-inner">
                {ring('Q', 'rational', '\\mathbb{Q}', 0)}
                {ring('Z', 'integers', '\\mathbb{Z}', 30)}
                {ring('N', 'natural', '\\mathbb{N}', 60)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={i} className="ns-chip" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }}>
                  <Tex>{cur.tex}</Tex>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="explore-side">
            <div className="choices one-col">
              {SETS.map((s) => (
                <button key={s.k} className={`choice ${picked ? (s.k === cur.s ? 'correct' : s.k === picked ? 'wrong' : 'dim') : ''}`} onClick={() => choose(s.k)}>
                  <Tex>{s.tex}</Tex> <span>{s.name}</span>
                </button>
              ))}
            </div>
            {picked && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`feedback ${picked === cur.s ? 'good' : 'bad'}`}>
                <MathText>{cur.why}</MathText>
                <button className="btn btn-primary" onClick={next}>{i + 1 >= SORT_ROUNDS ? 'Finish' : 'Next →'}</button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── 4. Truth tables ────────────────────────────────────── */
const LOGIC = [
  { key: 'and', label: '$p \\land q$', f: (p: boolean, q: boolean) => p && q, set: '\\cap' },
  { key: 'or', label: '$p \\lor q$', f: (p: boolean, q: boolean) => p || q, set: '\\cup' },
  { key: 'not', label: '$\\lnot p$', f: (p: boolean) => !p, set: '^{c}' },
  { key: 'imp', label: '$p \\Rightarrow q$', f: (p: boolean, q: boolean) => !p || q, set: '' },
  { key: 'iff', label: '$p \\Leftrightarrow q$', f: (p: boolean, q: boolean) => p === q, set: '' },
  { key: 'xor', label: '$p \\oplus q$', f: (p: boolean, q: boolean) => p !== q, set: '\\triangle' },
];

function TruthTable() {
  const [lk, setLk] = useState('imp');
  const [p, setP] = useState(true);
  const [q, setQ] = useState(false);
  const L = LOGIC.find((l) => l.key === lk)!;
  const rows: [boolean, boolean][] = [[true, true], [true, false], [false, true], [false, false]];
  const TF = (b: boolean) => (b ? 'T' : 'F');
  return (
    <div className="explore">
      <div className="explore-plot">
        <Tabs small value={lk} onChange={setLk} options={LOGIC.map((l) => ({ value: l.key, label: l.label }))} />
        <div className="toggles">
          <button className={`toggle ${p ? 'on' : ''}`} onClick={() => setP(!p)}>p = {TF(p)}</button>
          <button className={`toggle ${q ? 'on' : ''}`} onClick={() => setQ(!q)}>q = {TF(q)}</button>
          <motion.span key={`${lk}${p}${q}`} className={`toggle-out ${L.f(p, q) ? 'on' : ''}`} initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
            <MathText>{L.label}</MathText> = {TF(L.f(p, q))}
          </motion.span>
        </div>
        <table className="tt">
          <thead>
            <tr>
              <th>p</th>
              <th>q</th>
              <th>
                <MathText>{L.label}</MathText>
              </th>
              <th>
                <MathText>{'$\\lnot(p \\land q)$'}</MathText>
              </th>
              <th>
                <MathText>{'$\\lnot p \\lor \\lnot q$'}</MathText>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b]) => (
              <tr key={`${a}${b}`} className={a === p && b === q ? 'cur' : ''}>
                <td>{TF(a)}</td>
                <td>{TF(b)}</td>
                <td className={L.f(a, b) ? 't' : 'f'}>{TF(L.f(a, b))}</td>
                <td className={!(a && b) ? 't' : 'f'}>{TF(!(a && b))}</td>
                <td className={!a || !b ? 't' : 'f'}>{TF(!a || !b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="explore-side">
        <p className="muted">
          <MathText>Toggle $p$ and $q$: the highlighted row is the current situation. The last two columns are always identical, which is **De Morgan's law**.</MathText>
        </p>
        {L.key === 'imp' && (
          <Callout tone="warn" icon="🤔">
            <MathText>{'$p \\Rightarrow q$ is only false when $p$ is true and $q$ is false. "If it rains, I take an umbrella" isn\'t broken on a sunny day.'}</MathText>
          </Callout>
        )}
        {L.set && (
          <Callout tone="info" icon="🔗">
            <MathText>{`Logic ↔ sets: ${L.label} behaves exactly like $${L.set}$ for sets.`}</MathText>
          </Callout>
        )}
        <Callout tone="ai" icon="🧠">
          <MathText>Neural networks started as logic: a single perceptron can learn AND and OR, but famously **not XOR**, which is why we need hidden layers.</MathText>
        </Callout>
      </div>
    </div>
  );
}

/* ── 5. √2 is irrational ────────────────────────────────── */
const PROOF = [
  'Suppose $\\sqrt2$ **is** rational: $\\sqrt2 = \\frac pq$ with $p, q$ integers sharing **no common factor** (fully simplified).',
  'Square both sides: $2 = \\frac{p^2}{q^2}$, so $p^2 = 2q^2$. So $p^2$ is even.',
  'If $p^2$ is even then $p$ is even (odd × odd is odd). Write $p = 2k$.',
  'Then $4k^2 = 2q^2$, so $q^2 = 2k^2$: $q^2$ is even, so $q$ is even too.',
  'Both $p$ and $q$ are even, so they share the factor 2. **Contradiction!** So $\\sqrt2$ is irrational. ∎',
];
function ProofStepper() {
  const [n, setN] = useState(1);
  return (
    <Card className="stepper">
      <span className="kicker">Proof by contradiction</span>
      <div className="steps">
        {PROOF.slice(0, n).map((s, i) => (
          <motion.div key={i} className="step-line" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="step-num mono">{i + 1}</span>
            <span>
              <MathText>{s}</MathText>
            </span>
          </motion.div>
        ))}
      </div>
      <div className="btn-row">
        {n < PROOF.length ? (
          <button className="btn btn-primary" onClick={() => setN(n + 1)}>Next step →</button>
        ) : (
          <button className="btn btn-ghost" onClick={() => setN(1)}>Restart</button>
        )}
      </div>
    </Card>
  );
}

export default function Sets() {
  return (
    <>
      <Section id="venn" kicker="Sets" title="Venn diagrams you can read" intro="A **set** is a collection of distinct objects. Pick two sets of numbers and an operation and watch which region lights up.">
        <VennExplorer />
      </Section>

      <Section id="shade" kicker="Play" title="Three sets, eight regions">
        <ShadeGame />
      </Section>

      <Section id="numbers" kicker="Number systems" title="ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ" intro="Every number system lives inside the next one. The real numbers split into rationals (fractions) and irrationals (never-ending, never-repeating decimals).">
        <NumberSorter />
        <div style={{ marginTop: 16 }}>
          <ProofStepper />
        </div>
      </Section>

      <Section id="logic" kicker="Logic" title="Truth tables" intro="Logic is set theory with T/F instead of in/out. Computers, and the first neural networks, run on it.">
        <TruthTable />
      </Section>

      <Section id="rules" kicker="Cheat sheet" title="Notation & laws">
        <div className="rules-grid">
          <RuleCard title="Membership" tex="x \in A,\quad x \notin A" />
          <RuleCard title="Subset" tex="A \subseteq B" note="every element of $A$ is in $B$" />
          <RuleCard title="De Morgan (sets)" tex="(A \cup B)^c = A^c \cap B^c" note="and $(A \cap B)^c = A^c \cup B^c$" />
          <RuleCard title="De Morgan (logic)" tex="\lnot(p \land q) \equiv \lnot p \lor \lnot q" />
          <RuleCard title="Inclusion–exclusion" tex="|A \cup B| = |A| + |B| - |A \cap B|" />
          <RuleCard title="Power set" tex="|\mathcal{P}(A)| = 2^{|A|}" note="number of subsets, including $\varnothing$ and $A$" />
          <RuleCard title="Rationals" tex="\mathbb{Q} = \left\{ \tfrac{p}{q} : p, q \in \mathbb{Z},\ q \neq 0 \right\}" />
          <RuleCard title="Intervals" tex="[a, b) = \{x : a \le x < b\}" note="square = included, round = excluded" />
        </div>
      </Section>

      <MatlabSection topic="sets" />

      <Section id="practice" kicker="Practice" title="Sets, numbers & logic drills">
        <Quiz id="w1-quiz" title="Foundations Drills" blurb="Set operations, inclusion–exclusion, number systems, power sets and truth values." gens={FOUND_GENS.sets} />
      </Section>
    </>
  );
}

