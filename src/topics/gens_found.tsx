import { C, Curve, Plot } from '../components/Plot';
import type { Choice, Gen } from '../components/Quiz';
import { MatrixView } from '../components/Matrix';
import { fmt, fracTex, pick, polyTex, randInt, randNonZero, shuffle } from '../lib/math';

const $ = (s: string) => `$${s}$`;
/** Drop any distractor that happens to equal the correct answer. */
const uniq = (cs: Choice[]) => cs.filter((c) => c.correct || c.text !== cs.find((x) => x.correct)?.text);
const setTex = (xs: number[]) => (xs.length ? `\\{${[...xs].sort((a, b) => a - b).join(', ')}\\}` : '\\varnothing');
const sample = (pool: number[], k: number) => shuffle(pool).slice(0, k).sort((a, b) => a - b);

/* ───────────── Week 1 · Sets, numbers, logic ───────────── */

export const genSetOp: Gen = () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8];
  const A = sample(pool, randInt(3, 5)), B = sample(pool, randInt(3, 5));
  const ops = [
    { tex: 'A \\cup B', r: pool.filter((x) => A.includes(x) || B.includes(x)), how: 'everything in either set' },
    { tex: 'A \\cap B', r: pool.filter((x) => A.includes(x) && B.includes(x)), how: 'only what is in both' },
    { tex: 'A \\setminus B', r: A.filter((x) => !B.includes(x)), how: 'elements of A, removing any that are in B' },
    { tex: 'B \\setminus A', r: B.filter((x) => !A.includes(x)), how: 'elements of B, removing any that are in A' },
    { tex: 'A \\triangle B', r: pool.filter((x) => A.includes(x) !== B.includes(x)), how: 'in exactly one of the two' },
  ];
  const o = pick(ops);
  return {
    kind: 'mcq',
    prompt: `Let ${$(`A = ${setTex(A)}`)} and ${$(`B = ${setTex(B)}`)}. Find ${$(o.tex)}.`,
    choices: uniq([{ text: $(setTex(o.r)), correct: true }, ...ops.filter((x) => x !== o).map((x) => ({ text: $(setTex(x.r)) })), { text: $(setTex(A)) }, { text: $(setTex(B)) }]),
    explain: `$${o.tex}$ = ${o.how}: $$${o.tex} = ${setTex(o.r)}$$`,
  };
};

export const genInclExcl: Gen = () => {
  const both = randInt(2, 8), py = both + randInt(3, 12), ml = both + randInt(3, 12);
  const neither = randInt(0, 8), N = py + ml - both + neither;
  return {
    kind: 'num',
    prompt: `In a group of ${N} students, ${py} use Python, ${ml} use MATLAB and ${both} use both. How many use **neither**?`,
    answer: neither,
    explain: `$|P \\cup M| = |P| + |M| - |P \\cap M| = ${py} + ${ml} - ${both} = ${py + ml - both}$. Neither $= ${N} - ${py + ml - both} = ${neither}$.`,
  };
};

const NS_POOL: { tex: string; s: string }[] = [
  { tex: '\\sqrt{25}', s: '\\mathbb{N}' }, { tex: '12', s: '\\mathbb{N}' }, { tex: '-7', s: '\\mathbb{Z}' }, { tex: '-\\sqrt{4}', s: '\\mathbb{Z}' },
  { tex: '\\tfrac{5}{8}', s: '\\mathbb{Q}' }, { tex: '0.\\overline{6}', s: '\\mathbb{Q}' }, { tex: '-1.25', s: '\\mathbb{Q}' }, { tex: '\\sqrt{5}', s: '\\mathbb{R}\\setminus\\mathbb{Q}' },
  { tex: '\\pi', s: '\\mathbb{R}\\setminus\\mathbb{Q}' }, { tex: '\\sqrt{-9}', s: '\\mathbb{C}\\setminus\\mathbb{R}' }, { tex: '1 - i', s: '\\mathbb{C}\\setminus\\mathbb{R}' },
];
export const genNumberSet: Gen = () => {
  const n = pick(NS_POOL);
  const opts = ['\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{Q}', '\\mathbb{R}\\setminus\\mathbb{Q}', '\\mathbb{C}\\setminus\\mathbb{R}'];
  return {
    kind: 'mcq',
    prompt: `What is the **smallest** of these sets containing ${$(n.tex)}?`,
    choices: opts.map((o) => ({ text: $(o), correct: o === n.s })),
    explain: `$\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R} \\subset \\mathbb{C}$. Simplify first (e.g. $\\sqrt{25} = 5$, $\\sqrt{-9} = 3i$), then pick the innermost set: $${n.tex} \\in ${n.s}$.`,
  };
};

export const genTruth: Gen = () => {
  const p = Math.random() < 0.5, q = Math.random() < 0.5;
  const exprs = [
    { tex: 'p \\land q', v: p && q },
    { tex: 'p \\lor q', v: p || q },
    { tex: 'p \\Rightarrow q', v: !p || q },
    { tex: 'p \\Leftrightarrow q', v: p === q },
    { tex: '\\lnot p \\lor q', v: !p || q },
    { tex: '\\lnot(p \\land \\lnot q)', v: !(p && !q) },
    { tex: 'p \\oplus q', v: p !== q },
  ];
  const e = pick(exprs);
  const T = (b: boolean) => (b ? '\\text{T}' : '\\text{F}');
  return {
    kind: 'mcq',
    prompt: `If ${$(`p = ${T(p)}`)} and ${$(`q = ${T(q)}`)}, what is ${$(e.tex)}?`,
    choices: [{ text: 'True', correct: e.v }, { text: 'False', correct: !e.v }],
    explain: `Substitute and evaluate from the inside out. $\\land$ needs both true, $\\lor$ needs at least one, $p \\Rightarrow q$ is only false when $p$ is T and $q$ is F, $\\oplus$ needs exactly one. Result: **${e.v ? 'True' : 'False'}**.`,
  };
};

export const genPowerSet: Gen = () => {
  const n = randInt(2, 6);
  const els = 'abcdef'.slice(0, n).split('');
  return {
    kind: 'num',
    prompt: `How many subsets does ${$(`\\{${els.join(', ')}\\}`)} have (including ${$('\\varnothing')} and the set itself)?`,
    answer: 2 ** n,
    explain: `Each of the $${n}$ elements is either in or out of a subset: $2 \\times 2 \\times \\dots = 2^{${n}} = ${2 ** n}$.`,
  };
};

/* ───────────── Week 2 · Functions ───────────── */

function MappingSvg({ m, n, arrows }: { m: number; n: number; arrows: [number, number][] }) {
  const ly = (i: number, k: number) => 40 + (i * 160) / Math.max(1, k - 1);
  return (
    <svg viewBox="0 0 300 240" className="mapping-mini">
      <ellipse cx={60} cy={120} rx={42} ry={108} className="map-oval" />
      <ellipse cx={240} cy={120} rx={42} ry={108} className="map-oval" />
      {arrows.map(([a, b], k) => (
        <line key={k} x1={74} y1={ly(a, m)} x2={222} y2={ly(b, n)} className="map-arrow" markerEnd="url(#mm-head)" />
      ))}
      <defs>
        <marker id="mm-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#fbbf24" />
        </marker>
      </defs>
      {Array.from({ length: m }, (_, i) => (
        <text key={`d${i}`} x={60} y={ly(i, m) + 5} textAnchor="middle" className="map-el">{i + 1}</text>
      ))}
      {Array.from({ length: n }, (_, i) => (
        <text key={`c${i}`} x={240} y={ly(i, n) + 5} textAnchor="middle" className="map-el">{'abcd'[i]}</text>
      ))}
      <text x={60} y={236} textAnchor="middle" className="map-cap">X</text>
      <text x={240} y={236} textAnchor="middle" className="map-cap">Y</text>
    </svg>
  );
}

export const genMapping: Gen = () => {
  const m = randInt(3, 4), n = randInt(3, 4);
  let arrows: [number, number][] = Array.from({ length: m }, (_, i) => [i, randInt(0, n - 1)] as [number, number]);
  if (Math.random() < 0.35 && m <= n) arrows = shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, m).map((y, i) => [i, y]);
  let notFn: 'missing' | 'double' | null = null;
  const r = Math.random();
  if (r < 0.12) {
    notFn = 'missing';
    arrows = arrows.filter((_, i) => i !== m - 1);
  } else if (r < 0.24) {
    notFn = 'double';
    const ys = arrows[0][1];
    arrows = [...arrows, [0, (ys + 1) % n]];
  }
  const imgs = new Set(arrows.map((a) => a[1]));
  const inj = imgs.size === arrows.length;
  const surj = imgs.size === n;
  const answer = notFn ? 'Not a function' : inj && surj ? 'Bijective' : inj ? 'Injective only' : surj ? 'Surjective only' : 'Neither injective nor surjective';
  return {
    kind: 'mcq',
    prompt: 'Classify this mapping from X to Y.',
    visual: <MappingSvg m={m} n={n} arrows={arrows} />,
    choices: ['Not a function', 'Injective only', 'Surjective only', 'Bijective', 'Neither injective nor surjective'].map((t) => ({ text: t, correct: t === answer })),
    explain: notFn
      ? `A function must send **every** element of X to **exactly one** element of Y. Here ${notFn === 'missing' ? `element ${m} has no arrow` : 'element 1 has two arrows'}, so it is not a function.`
      : `**Injective** (one-to-one): no two arrows land on the same element, ${inj ? 'true here' : 'false here'}. **Surjective** (onto): every element of Y is hit, ${surj ? 'true here' : 'false here'}. Both = bijective (invertible).`,
  };
};

export const genCompose: Gen = () => {
  const a = randNonZero(-3, 4), b = randInt(-5, 5), c = randInt(-4, 4), k = randInt(-3, 3);
  const f = (x: number) => a * x + b, g = (x: number) => x * x + c;
  const which = pick(['fg', 'gf'] as const);
  const ans = which === 'fg' ? f(g(k)) : g(f(k));
  return {
    kind: 'num',
    prompt: `${$(`f(x) = ${polyTex([[a, 1], [b, 0]])}`)} and ${$(`g(x) = ${polyTex([[1, 2], [c, 0]])}`)}. Find ${$(which === 'fg' ? `(f \\circ g)(${k})` : `(g \\circ f)(${k})`)}.`,
    answer: ans,
    explain:
      which === 'fg'
        ? `$(f\\circ g)(x) = f(g(x))$: apply $g$ **first**. $g(${k}) = ${g(k)}$, then $f(${g(k)}) = ${ans}$.`
        : `$(g\\circ f)(x) = g(f(x))$: apply $f$ **first**. $f(${k}) = ${f(k)}$, then $g(${f(k)}) = ${ans}$.`,
  };
};

export const genInverse: Gen = () => {
  const a = pick([2, 3, 4, 5, -2]), b = randNonZero(-6, 6);
  const bt = b < 0 ? `+ ${-b}` : `- ${b}`;
  return {
    kind: 'mcq',
    prompt: `Find the inverse of ${$(`f(x) = ${polyTex([[a, 1], [b, 0]])}`)}.`,
    choices: [
      { text: $(`f^{-1}(x) = \\dfrac{x ${bt}}{${a}}`), correct: true },
      { text: $(`f^{-1}(x) = \\dfrac{1}{${polyTex([[a, 1], [b, 0]])}}`) },
      { text: $(`f^{-1}(x) = \\dfrac{x}{${a}} ${bt}`) },
      { text: $(`f^{-1}(x) = ${polyTex([[-a, 1], [-b, 0]])}`) },
    ],
    explain: `Write $y = ${polyTex([[a, 1], [b, 0]])}$ and solve for $x$: $x = \\frac{y ${bt}}{${a}}$. Then swap the letters. Note $f^{-1}(x) \\neq \\frac{1}{f(x)}$!`,
  };
};

export const genDomain: Gen = () => {
  const a = randNonZero(-5, 5);
  const kind = pick(['sqrt', 'ln', 'frac'] as const);
  const inner = polyTex([[1, 1], [-a, 0]]);
  if (kind === 'sqrt')
    return {
      kind: 'mcq',
      prompt: `What is the (largest real) domain of ${$(`f(x) = \\sqrt{${inner}}`)}?`,
      choices: [{ text: $(`x \\ge ${a}`), correct: true }, { text: $(`x > ${a}`) }, { text: $(`x \\le ${a}`) }, { text: $('\\text{all } x \\in \\mathbb{R}') }],
      explain: `You can't take the real square root of a negative, so $${inner} \\ge 0$, i.e. $x \\ge ${a}$ (zero is allowed).`,
    };
  if (kind === 'ln')
    return {
      kind: 'mcq',
      prompt: `What is the domain of ${$(`f(x) = \\ln(${inner})`)}?`,
      choices: [{ text: $(`x > ${a}`), correct: true }, { text: $(`x \\ge ${a}`) }, { text: $(`x < ${a}`) }, { text: $('\\text{all } x \\in \\mathbb{R}') }],
      explain: `$\\ln$ is only defined for **strictly positive** inputs, so $${inner} > 0$, i.e. $x > ${a}$.`,
    };
  return {
    kind: 'mcq',
    prompt: `What is the domain of ${$(`f(x) = \\dfrac{1}{${inner}}`)}?`,
    choices: [{ text: $(`x \\neq ${a}`), correct: true }, { text: $(`x > ${a}`) }, { text: $(`x \\neq ${-a}`) }, { text: $('\\text{all } x \\in \\mathbb{R}') }],
    explain: `Division by zero is undefined, so exclude $${inner} = 0$, i.e. $x \\neq ${a}$.`,
  };
};

/* ───────────── Week 2 · Quadratics & polynomials ───────────── */

export const genDiscriminant: Gen = () => {
  const target = pick(['pos', 'zero', 'neg'] as const);
  const a = randNonZero(-3, 3);
  let b: number, c: number;
  if (target === 'zero') {
    const h = randInt(-3, 3);
    b = -2 * a * h;
    c = a * h * h;
  } else if (target === 'pos') {
    const r1 = randInt(-4, 4), r2 = r1 + randInt(1, 4);
    b = -a * (r1 + r2);
    c = a * r1 * r2;
  } else {
    b = randInt(-6, 6);
    const q = (b * b) / (4 * a);
    c = a > 0 ? Math.floor(q) + randInt(1, 3) : Math.ceil(q) - randInt(1, 3);
  }
  const D = b * b - 4 * a * c;
  const ans = D > 0 ? 'Two distinct real roots' : D === 0 ? 'One repeated real root' : 'No real roots (two complex)';
  return {
    kind: 'mcq',
    prompt: `How many real roots does ${$(`${polyTex([[a, 2], [b, 1], [c, 0]])} = 0`)} have?`,
    choices: ['Two distinct real roots', 'One repeated real root', 'No real roots (two complex)'].map((t) => ({ text: t, correct: t === ans })),
    explain: `Discriminant $\\Delta = b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${D}$. $\\Delta > 0$: two roots; $\\Delta = 0$: one repeated; $\\Delta < 0$: none real.`,
  };
};

export const genSolveQuad: Gen = () => {
  let r1 = randInt(-6, 6), r2 = randInt(-6, 6);
  if (r1 === r2) r2 = r1 + randInt(1, 3);
  const b = -(r1 + r2), c = r1 * r2;
  const s = (x: number, y: number) => $(`x = ${Math.min(x, y)} \\text{ or } x = ${Math.max(x, y)}`);
  return {
    kind: 'mcq',
    prompt: `Solve ${$(`${polyTex([[1, 2], [b, 1], [c, 0]])} = 0`)}`,
    choices: uniq([{ text: s(r1, r2), correct: true }, { text: s(-r1, -r2) }, { text: s(r1, -r2) }, { text: s(-r1, r2) }]),
    explain: `Find two numbers that multiply to $${c}$ and add to $${b}$: they are $${-r1}$ and $${-r2}$. So $(x ${-r1 < 0 ? '-' : '+'} ${Math.abs(r1)})(x ${-r2 < 0 ? '-' : '+'} ${Math.abs(r2)}) = 0$, giving $x = ${r1}$ or $x = ${r2}$. (Careful with signs: the factor $(x - r)$ gives root $+r$.)`,
  };
};

export const genVertex: Gen = () => {
  const a = pick([1, -1, 2]), h = randInt(-4, 4), k = randInt(-6, 6);
  const b = -2 * a * h, c = a * h * h + k;
  const which = pick(['x', 'y'] as const);
  return {
    kind: 'num',
    prompt: `Complete the square for ${$(`y = ${polyTex([[a, 2], [b, 1], [c, 0]])}`)}. What is the ${$(which)}-coordinate of the vertex?`,
    answer: which === 'x' ? h : k,
    explain: `$y = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}$. Vertex form $a(x-h)^2 + k$ has vertex $(h, k) = (${h}, ${k})$. Shortcut: $x = -\\frac{b}{2a} = ${h}$.`,
  };
};

export const genFactorTheorem: Gen = () => {
  const k = randInt(-3, 3), r2 = randInt(-3, 3), r3 = randInt(-3, 3);
  const isFactor = Math.random() < 0.5;
  // p(x) = (x - k0)(x - r2)(x - r3) where k0 = k if factor else something else
  const k0 = isFactor ? k : k + pick([1, -1, 2]);
  const b = -(k0 + r2 + r3), c = k0 * r2 + k0 * r3 + r2 * r3, d = -k0 * r2 * r3;
  const p = (x: number) => x ** 3 + b * x * x + c * x + d;
  const val = p(k);
  return {
    kind: 'mcq',
    prompt: `Is ${$(`(x ${k < 0 ? '+' : '-'} ${Math.abs(k)})`)} a factor of ${$(`p(x) = ${polyTex([[1, 3], [b, 2], [c, 1], [d, 0]])}`)}?`,
    choices: [{ text: `Yes: $p(${k}) = 0$`, correct: val === 0 }, { text: `No: $p(${k}) \\neq 0$`, correct: val !== 0 }],
    explain: `**Factor theorem:** $(x - a)$ is a factor exactly when $p(a) = 0$. Here $p(${k}) = ${val}$, so ${val === 0 ? 'yes' : 'no'}.`,
  };
};

export const genMatchGraph: Gen = () => {
  let r1 = randInt(-3, 2), r2 = randInt(-2, 3);
  if (r1 === r2) r2 = r1 + 2;
  const a = pick([1, -1]);
  const f = (x: number) => a * (x - r1) * (x - r2);
  const fac = (r: number) => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`);
  const eq = (p: number, q: number, sg: number) => `y = ${sg < 0 ? '-' : ''}${p === 0 ? fac(p) + fac(q) : fac(q) === 'x' ? fac(q) + fac(p) : fac(p) + fac(q)}`;
  return {
    kind: 'mcq',
    prompt: 'Which equation matches this graph?',
    visual: (
      <Plot view={{ xMin: -5, xMax: 5, yMin: -8, yMax: 8 }} height={220} ariaLabel="Parabola">
        <Curve f={f} color={C.curve} />
      </Plot>
    ),
    choices: uniq([
      { text: $(eq(r1, r2, a)), correct: true },
      { text: $(eq(-r1, -r2, a)) },
      { text: $(eq(r1, r2, -a)) },
      { text: $(eq(-r1, -r2, -a)) },
    ]),
    explain: `Read the **x-intercepts**: $x = ${r1}$ and $x = ${r2}$, so the factors are $(x - ${r1})(x - ${r2})$. The parabola opens ${a > 0 ? 'upward (∪), so the leading coefficient is positive' : 'downward (∩), so there is a minus sign in front'}.`,
  };
};

/* ───────────── Week 3 · Exponentials & logs ───────────── */

export const genLogEval: Gen = () => {
  const b = pick([2, 3, 5, 10]);
  const k = b === 2 ? randInt(-3, 7) : b === 10 ? randInt(-3, 4) : randInt(-2, 4);
  const N = b ** k;
  const Ntex = k >= 0 ? `${N}` : `\\tfrac{1}{${b ** -k}}`;
  return {
    kind: 'num',
    prompt: `Evaluate ${$(`\\log_{${b}} ${Ntex}`)}`,
    answer: k,
    explain: `$\\log_{${b}} N$ asks "${b} to the power **what** gives N?". Since $${b}^{${k}} = ${Ntex}$, the answer is $${k}$.`,
  };
};

export const genSolveExp: Gen = () => {
  const b = pick([2, 3, 5]), N = pick([7, 10, 20, 50, 100]);
  const x = Math.log(N) / Math.log(b);
  return {
    kind: 'num',
    prompt: `Solve ${$(`${b}^{x} = ${N}`)} (to 2 decimal places).`,
    answer: x,
    tol: 0.01,
    explain: `Take logs of both sides: $x\\ln ${b} = \\ln ${N}$, so $$x = \\frac{\\ln ${N}}{\\ln ${b}} = \\frac{${fmt(Math.log(N), 4)}}{${fmt(Math.log(b), 4)}} \\approx ${fmt(x, 3)}$$`,
  };
};

const LOG_LAWS = [
  { q: '\\ln(xy)', a: '\\ln x + \\ln y', w: ['\\ln x \\cdot \\ln y', '\\ln(x) + y', '\\ln(x + y)'] },
  { q: '\\ln\\!\\left(\\tfrac{x}{y}\\right)', a: '\\ln x - \\ln y', w: ['\\dfrac{\\ln x}{\\ln y}', '\\ln(x - y)', '\\ln y - \\ln x'] },
  { q: '\\ln(x^{5})', a: '5\\ln x', w: ['(\\ln x)^{5}', '\\ln 5x', '5 + \\ln x'] },
  { q: '\\ln(e^{4x})', a: '4x', w: ['e^{4x}', '4\\ln x', '4'] },
  { q: 'e^{3\\ln x}', a: 'x^{3}', w: ['3x', 'e^{3}x', '3\\ln x'] },
  { q: '\\log_{2} 8 + \\log_{2} 4', a: '5', w: ['\\log_{2} 12', '6', '32'] },
];
export const genLogLaws: Gen = () => {
  const l = pick(LOG_LAWS);
  return {
    kind: 'mcq',
    prompt: `Simplify ${$(l.q)}`,
    choices: [{ text: $(l.a), correct: true }, ...l.w.map((w) => ({ text: $(w) }))],
    explain: `Log laws: $\\ln(xy) = \\ln x + \\ln y$, $\\ln\\frac xy = \\ln x - \\ln y$, $\\ln x^n = n\\ln x$, and $\\ln$ and $e^{(\\cdot)}$ undo each other. So $$${l.q} = ${l.a}$$ Watch out: there is **no** rule for $\\ln(x + y)$.`,
  };
};

export const genDoubling: Gen = () => {
  const r = pick([0.02, 0.05, 0.07, 0.1, 0.25]);
  return {
    kind: 'num',
    prompt: `A quantity grows as ${$(`P(t) = P_0 e^{${r}t}`)}. How long until it doubles? (2 d.p.)`,
    answer: Math.log(2) / r,
    tol: 0.01,
    explain: `Set $P = 2P_0$: $2 = e^{${r}t}$, take $\\ln$: $\\ln 2 = ${r}t$, so $t = \\frac{\\ln 2}{${r}} \\approx ${fmt(Math.log(2) / r, 3)}$.`,
  };
};

export const genSoftmax: Gen = () => {
  const a = randInt(1, 4), b = randInt(1, 5), c = randInt(1, 4);
  const z = [a, b, c].map((v) => (v === 1 ? '0' : `\\ln ${v}`));
  return {
    kind: 'num',
    prompt: `A classifier outputs logits ${$(`z = (${z.join(', ')})`)}. What probability does **softmax** give to the second class? (Fractions OK.)`,
    answer: b / (a + b + c),
    tol: 0.005,
    explain: `Softmax: $p_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$. Since $e^{\\ln v} = v$ (and $e^0 = 1$), the exponentials are $${a}, ${b}, ${c}$. So $p_2 = \\frac{${b}}{${a} + ${b} + ${c}} = ${fracTex(b, a + b + c)}$.`,
  };
};

/* ───────────── Week 3 · Vectors, matrices, norms ───────────── */

export const genDot: Gen = () => {
  const u = [randInt(-4, 5), randInt(-4, 5), randInt(-3, 4)], v = [randInt(-4, 5), randInt(-4, 5), randInt(-3, 4)];
  const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return {
    kind: 'num',
    prompt: `Compute ${$(`\\mathbf{u}\\cdot\\mathbf{v}`)} for ${$(`\\mathbf{u} = (${u.join(', ')})`)}, ${$(`\\mathbf{v} = (${v.join(', ')})`)}.`,
    answer: d,
    explain: `Multiply matching entries and add: $$${u.map((x, i) => `(${x})(${v[i]})`).join(' + ')} = ${d}$$ ${d === 0 ? 'Zero means the vectors are perpendicular!' : ''}`,
  };
};

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
export const genNorm: Gen = () => {
  const t = pick(TRIPLES);
  const x = t[0] * pick([1, -1]), y = t[1] * pick([1, -1]);
  const which = pick(['1', '2', '\\infty'] as const);
  const ans = which === '1' ? Math.abs(x) + Math.abs(y) : which === '2' ? t[2] : Math.max(Math.abs(x), Math.abs(y));
  return {
    kind: 'num',
    prompt: `Find ${$(`\\|\\mathbf{x}\\|_{${which}}`)} for ${$(`\\mathbf{x} = (${x}, ${y})`)}.`,
    answer: ans,
    explain:
      which === '1'
        ? `$\\|x\\|_1$ = sum of absolute values ("taxicab"): $${Math.abs(x)} + ${Math.abs(y)} = ${ans}$.`
        : which === '2'
          ? `$\\|x\\|_2 = \\sqrt{x_1^2 + x_2^2} = \\sqrt{${x * x} + ${y * y}} = ${ans}$: the ordinary length.`
          : `$\\|x\\|_\\infty$ = largest absolute entry: $\\max(${Math.abs(x)}, ${Math.abs(y)}) = ${ans}$.`,
  };
};

const rmat = (r: number, c: number, lo = -3, hi = 4) => Array.from({ length: r }, () => Array.from({ length: c }, () => randInt(lo, hi)));

export const genMatMulEntry: Gen = () => {
  const A = rmat(2, 3), B = rmat(3, 2);
  const i = randInt(0, 1), j = randInt(0, 1);
  const v = A[i].reduce((s, a, k) => s + a * B[k][j], 0);
  return {
    kind: 'num',
    prompt: `Find entry ${$(`(AB)_{${i + 1}${j + 1}}`)} (row ${i + 1}, column ${j + 1}).`,
    visual: (
      <div className="matrix-pair">
        <MatrixView m={A} label="A" hiRows={[i]} />
        <MatrixView m={B} label="B" hiCols={[j]} />
      </div>
    ),
    answer: v,
    explain: `Row ${i + 1} of $A$ dotted with column ${j + 1} of $B$: $$${A[i].map((a, k) => `(${a})(${B[k][j]})`).join(' + ')} = ${v}$$`,
  };
};

export const genDet2: Gen = () => {
  const [[a, b], [c, d]] = rmat(2, 2, -5, 6);
  const det = a * d - b * c;
  return {
    kind: 'num',
    prompt: `Find ${$(`\\det\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`)}`,
    answer: det,
    explain: `$\\det = ad - bc = (${a})(${d}) - (${b})(${c}) = ${det}$. ${det === 0 ? 'Zero: the matrix is singular (not invertible).' : `Geometrically, the matrix scales areas by $|${det}|$.`}`,
  };
};

export const genMatNorm: Gen = () => {
  const A = rmat(3, 3, -5, 5);
  const which = pick(['1', '\\infty'] as const);
  const rows = A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0));
  const cols = [0, 1, 2].map((j) => A.reduce((s, r) => s + Math.abs(r[j]), 0));
  const ans = which === '1' ? Math.max(...cols) : Math.max(...rows);
  return {
    kind: 'num',
    prompt: `Find ${$(`\\|A\\|_{${which}}`)}.`,
    visual: <MatrixView m={A} label="A" />,
    answer: ans,
    explain:
      which === '1'
        ? `$\\|A\\|_1$ = **maximum absolute column sum**. Column sums of $|a_{ij}|$: ${cols.join(', ')}. Max = ${ans}.`
        : `$\\|A\\|_\\infty$ = **maximum absolute row sum**. Row sums of $|a_{ij}|$: ${rows.join(', ')}. Max = ${ans}.`,
  };
};

export const genSizes: Gen = () => {
  const m = randInt(1, 4), n = randInt(1, 4), p = randInt(1, 4), q = Math.random() < 0.3 ? n + 1 : n;
  const ok = q === n;
  return {
    kind: 'mcq',
    prompt: `${$('A')} is ${$(`${m}\\times${n}`)} and ${$('B')} is ${$(`${q}\\times${p}`)}. What size is ${$('AB')}?`,
    choices: uniq([
      { text: ok ? $(`${m}\\times${p}`) : 'Not defined', correct: true },
      { text: ok ? 'Not defined' : $(`${m}\\times${p}`) },
      { text: $(`${n}\\times${q}`) },
      { text: $(`${p}\\times${m}`) },
    ]),
    explain: `$(m\\times n)(n\\times p) = m\\times p$: the **inner** sizes must match. ${ok ? `Here $${n} = ${q}$ ✓, so the result is $${m}\\times${p}$.` : `Here $${n} \\neq ${q}$, so the product is not defined.`}`,
  };
};

export const FOUND_GENS = {
  sets: [genSetOp, genInclExcl, genNumberSet, genTruth, genPowerSet],
  functions: [genMapping, genCompose, genInverse, genDomain],
  polynomials: [genDiscriminant, genSolveQuad, genVertex, genFactorTheorem, genMatchGraph],
  explog: [genLogEval, genSolveExp, genLogLaws, genDoubling, genSoftmax],
  vectors: [genDot, genNorm, genMatMulEntry, genDet2, genMatNorm, genSizes],
};
