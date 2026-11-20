import type { Gen } from '../components/Quiz';
import { fmt, pick, randInt, shuffle } from '../lib/math';
import { CodeView } from './MatlabCode';

const vec = (v: number[]) => (v.length ? `\`[${v.join(' ')}]\`` : '`[]` (empty)');

export const mlSets: Gen = () => {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const A = shuffle(pool).slice(0, 4), B = shuffle(pool).slice(0, 4);
  const u = [...new Set([...A, ...B])].sort((a, b) => a - b);
  const i = A.filter((x) => B.includes(x)).sort((a, b) => a - b);
  const d = A.filter((x) => !B.includes(x)).sort((a, b) => a - b);
  const op = pick([{ fn: 'union', r: u }, { fn: 'intersect', r: i }, { fn: 'setdiff', r: d }]);
  const others = [u, i, d, [...A].sort((a, b) => a - b), [...A, ...B]].map(vec);
  return {
    kind: 'mcq',
    prompt: `What does \`${op.fn}([${A.join(' ')}], [${B.join(' ')}])\` return?`,
    choices: [{ text: vec(op.r), correct: true }, ...others.filter((t) => t !== vec(op.r)).map((t) => ({ text: t }))].slice(0, 4),
    explain: `\`union\` = in either, \`intersect\` = in both, \`setdiff(A, B)\` = in A but not B. MATLAB always returns the result **sorted with no repeats**: ${vec(op.r)}.`,
  };
};

export const mlCompose: Gen = () => {
  const a = randInt(2, 4), b = randInt(-3, 3), c = randInt(-2, 3), k = randInt(-2, 3);
  const order = pick(['fg', 'gf'] as const);
  const f = (x: number) => a * x + b, g = (x: number) => x * x + c;
  return {
    kind: 'num',
    prompt: 'What number does the last line display?',
    visual: <CodeView code={`f = @(x) ${a}*x ${b < 0 ? '-' : '+'} ${Math.abs(b)};\ng = @(x) x.^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)};\nh = @(x) ${order === 'fg' ? 'f(g(x))' : 'g(f(x))'};\nh(${k})`} />,
    answer: order === 'fg' ? f(g(k)) : g(f(k)),
    explain: order === 'fg' ? `Inner first: $g(${k}) = ${g(k)}$, then $f(${g(k)}) = ${f(g(k))}$.` : `Inner first: $f(${k}) = ${f(k)}$, then $g(${f(k)}) = ${g(f(k))}$.`,
  };
};

export const mlPoly: Gen = () => {
  let r1 = randInt(-4, 4), r2 = randInt(-4, 4);
  if (r1 === r2) r2 += 1;
  const right = [1, -(r1 + r2), r1 * r2];
  return {
    kind: 'mcq',
    prompt: `What does \`poly([${r1} ${r2}])\` return? (It builds the polynomial with these roots.)`,
    choices: [
      { text: vec(right), correct: true },
      { text: vec([1, r1 + r2, r1 * r2]) },
      { text: vec([1, -(r1 + r2), -r1 * r2]) },
      { text: vec([r1, r2]) },
    ].filter((c, i, arr) => c.correct || c.text !== arr[0].text),
    explain: `$(x - (${r1}))(x - (${r2})) = x^2 - (${r1 + r2})x + (${r1 * r2})$, so the coefficients are ${vec(right)}.`,
  };
};

export const mlLogs: Gen = () => {
  const q = pick([
    { c: () => { const k = randInt(2, 9); return { code: `log2(${2 ** k})`, a: k }; } },
    { c: () => { const k = randInt(-3, 5); return { code: `log10(${10 ** k})`, a: k }; } },
    { c: () => { const k = randInt(-4, 6); return { code: `log(exp(${k}))`, a: k }; } },
    { c: () => ({ code: 'exp(log(7))', a: 7 }) },
  ]).c();
  return {
    kind: 'num',
    prompt: `What does \`${q.code}\` return?`,
    answer: q.a,
    explain: `\`log2\` is base 2, \`log10\` base 10, and \`log\` is the **natural** log (base $e$), the inverse of \`exp\`. Answer: ${q.a}.`,
  };
};

export const mlNorm: Gen = () => {
  const t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
  const v = [t[0] * pick([1, -1]), t[1] * pick([1, -1])];
  const which = pick(['', ', 1', ', Inf'] as const);
  const ans = which === '' ? t[2] : which === ', 1' ? t[0] + t[1] : Math.max(t[0], t[1]);
  return {
    kind: 'num',
    prompt: `What does \`norm([${v.join(' ')}]${which})\` return?`,
    answer: ans,
    explain: `No second argument = 2-norm ($\\sqrt{x_1^2 + x_2^2}$), \`1\` = sum of absolute values, \`Inf\` = largest absolute value. Answer: ${ans}.`,
  };
};

export const mlStarDot: Gen = () => {
  const a = randInt(1, 3), b = randInt(0, 3), c = randInt(0, 3), d = randInt(1, 3);
  const op = pick(['*', '.*'] as const);
  const B = [[0, 1], [1, 0]];
  const A = [[a, b], [c, d]];
  const prod = op === '*' ? A.map((r) => [r[0] * B[0][0] + r[1] * B[1][0], r[0] * B[0][1] + r[1] * B[1][1]]) : A.map((r, i) => r.map((v, j) => v * B[i][j]));
  const other = op === '*' ? A.map((r, i) => r.map((v, j) => v * B[i][j])) : A.map((r) => [r[0] * B[0][0] + r[1] * B[1][0], r[0] * B[0][1] + r[1] * B[1][1]]);
  const show = (M: number[][]) => `\`[${M.map((r) => r.join(' ')).join('; ')}]\``;
  return {
    kind: 'mcq',
    prompt: `With \`A = [${a} ${b}; ${c} ${d}]\` and \`B = [0 1; 1 0]\`, what is \`A ${op} B\`?`,
    choices: [{ text: show(prod), correct: true }, { text: show(other) }, { text: show(A) }, { text: show([[d, c], [b, a]]) }].filter((x, i, arr) => x.correct || x.text !== arr[0].text),
    explain: op === '*' ? '`*` is the **matrix** product (row × column). Multiplying by `[0 1; 1 0]` on the right swaps the columns of A.' : '`.*` multiplies **entry by entry**, so the zeros in B wipe out the diagonal of A.',
  };
};

export const mlBackslash: Gen = () => {
  const a = randInt(1, 4), c = randInt(-3, 3), d = randInt(1, 3);
  const x1 = randInt(-3, 4), x2 = randInt(-3, 4);
  const b1 = a * x1, b2 = c * x1 + d * x2;
  const which = pick([1, 2]);
  return {
    kind: 'num',
    prompt: `What is \`x(${which})\` after this code?`,
    visual: <CodeView code={`A = [${a} 0; ${c} ${d}];\nb = [${b1}; ${b2}];\nx = A\\b;`} />,
    answer: which === 1 ? x1 : x2,
    explain: `\`A\\b\` solves $A\\mathbf x = \\mathbf b$. A is lower triangular, so forward-substitute: $x_1 = ${b1}/${a} = ${x1}$, then $x_2 = (${b2} - (${c})(${x1}))/${d} = ${x2}$.`,
  };
};

export const mlFloat: Gen = () => {
  const q = pick([
    { code: '0.1 + 0.2 == 0.3', a: '`0` (false)', w: ['`1` (true)', 'an error', '`0.3`'], e: '0.1 and 0.2 are not exact in binary; the sum is 0.30000000000000004.' },
    { code: 'abs((0.1 + 0.2) - 0.3) < 1e-10', a: '`1` (true)', w: ['`0` (false)', 'an error', '`1e-10`'], e: 'The difference is about 5.6e-17, far below the tolerance. Comparing with a tolerance is the right way.' },
    { code: '1 + eps/4 == 1', a: '`1` (true)', w: ['`0` (false)', 'an error', '`eps`'], e: 'Anything smaller than about eps/2 added to 1 rounds away completely.' },
  ]);
  return {
    kind: 'mcq',
    prompt: `What does \`${q.code}\` return?`,
    choices: [{ text: q.a, correct: true }, ...q.w.map((w) => ({ text: w }))],
    explain: q.e,
  };
};

export const mlLoop: Gen = () => {
  const c = randInt(1, 6), a = pick([0.5, 0.25]), n = pick([2, 3]);
  let x = 0;
  for (let k = 0; k < n; k++) x = a * x + c;
  return {
    kind: 'num',
    prompt: 'What is `x` after this loop?',
    visual: <CodeView code={`x = 0;\nfor k = 1:${n}\n    x = ${a}*x + ${c};\nend`} />,
    answer: x,
    explain: `Iterate by hand: ${Array.from({ length: n }, (_, k) => `$x_${k + 1}$`).join(', ')} = ${(() => { let y = 0; return Array.from({ length: n }, () => fmt((y = a * y + c), 4)).join(', '); })()}. It's a fixed-point iteration heading for $x^* = ${fmt(c / (1 - a), 3)}$.`,
  };
};

export const mlNewton: Gen = () => {
  const A = pick([2, 3, 5, 10]), x0 = pick([1, 2, 3]);
  const x1 = x0 - (x0 * x0 - A) / (2 * x0);
  return {
    kind: 'num',
    prompt: 'What is `x` after one pass (3 d.p.)?',
    visual: <CodeView code={`f  = @(x) x.^2 - ${A};\ndf = @(x) 2*x;\nx = ${x0};\nx = x - f(x)/df(x);`} />,
    answer: x1,
    tol: 0.001,
    explain: `$x = ${x0} - \\frac{${x0 * x0 - A}}{${2 * x0}} = ${fmt(x1, 4)}$: one Newton step towards $\\sqrt{${A}} \\approx ${fmt(Math.sqrt(A), 4)}$.`,
  };
};

export const mlTrapz: Gen = () => {
  const y = [randInt(0, 4), randInt(0, 6), randInt(0, 6), randInt(0, 4)];
  const ans = (y[0] + y[3]) / 2 + y[1] + y[2];
  return {
    kind: 'num',
    prompt: `What does \`trapz([0 1 2 3], [${y.join(' ')}])\` return?`,
    answer: ans,
    explain: `Three trapezia of width 1: $\\frac{${y[0]} + ${y[1]}}{2} + \\frac{${y[1]} + ${y[2]}}{2} + \\frac{${y[2]} + ${y[3]}}{2} = ${fmt(ans)}$.`,
  };
};

export const mlSimpWeights: Gen = () => ({
  kind: 'mcq',
  prompt: "For composite Simpson with `n = 4` strips, which weight vector multiplies `f(x)` (before the `h/3`)?",
  choices: [{ text: '`[1 4 2 4 1]`', correct: true }, { text: '`[1 2 2 2 1]`' }, { text: '`[1 4 4 4 1]`' }, { text: '`[0.5 1 1 1 0.5]`' }],
  explain: 'Simpson alternates 4, 2, 4, … inside with 1 at each end. `[1 2 2 2 1]`·h/2 (= `[0.5 1 1 1 0.5]`·h) is the trapezium rule.',
});

export const ML_GENS2: Record<string, Gen[]> = {
  sets: [mlSets],
  functions: [mlCompose],
  polynomials: [mlPoly],
  explog: [mlLogs],
  vectors: [mlNorm, mlStarDot],
  linsys: [mlBackslash],
  lu: [mlFloat, mlBackslash],
  iterative: [mlLoop],
  newton: [mlNewton],
  numint: [mlTrapz, mlSimpWeights],
};
