import { MatrixView } from '../components/Matrix';
import type { Gen } from '../components/Quiz';
import { fmt, pick, randInt, randNonZero } from '../lib/math';

const $ = (s: string) => `$${s}$`;
const sys2 = (a: number, b: number, c: number, d: number, e: number, f: number) =>
  `\\begin{cases} ${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}y = ${e} \\\\ ${c}x ${d < 0 ? '-' : '+'} ${Math.abs(d)}y = ${f} \\end{cases}`;

/* ───────────── Week 4 · Linear systems ───────────── */

export const genSolve2x2: Gen = () => {
  let a: number, b: number, c: number, d: number;
  do {
    [a, b, c, d] = [randNonZero(-4, 5), randNonZero(-4, 5), randNonZero(-4, 5), randNonZero(-4, 5)];
  } while (a * d - b * c === 0);
  const x = randInt(-4, 4), y = randInt(-4, 4);
  const e = a * x + b * y, f = c * x + d * y;
  const which = pick(['x', 'y'] as const);
  return {
    kind: 'num',
    prompt: `Solve ${$(sys2(a, b, c, d, e, f))}. What is ${$(which)}?`,
    answer: which === 'x' ? x : y,
    explain: `Eliminate: $R_2 \\leftarrow R_2 - \\frac{${c}}{${a}}R_1$ gives $${fmt(d - (c / a) * b, 4)}\\,y = ${fmt(f - (c / a) * e, 4)}$, so $y = ${y}$. Substitute back: $${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${y}) = ${e}$ gives $x = ${x}$.`,
  };
};

export const genClassify2x2: Gen = () => {
  const a = randNonZero(-3, 3), b = randNonZero(-3, 3), k = pick([2, -1, 3]), e = randInt(-5, 5);
  const kind = pick(['unique', 'none', 'inf'] as const);
  let [c, d, f] = kind === 'none' ? [k * a, k * b, k * e + pick([1, -2, 3])] : [k * a, k * b, k * e];
  if (kind === 'unique') {
    do {
      [c, d] = [randNonZero(-3, 4), randNonZero(-3, 4)];
    } while (a * d - b * c === 0);
    f = randInt(-5, 5);
  }
  const det = a * d - b * c;
  const ans = det !== 0 ? 'Exactly one solution' : kind === 'inf' ? 'Infinitely many solutions' : 'No solution';
  return {
    kind: 'mcq',
    prompt: `How many solutions does ${$(sys2(a, b, c, d, e, f))} have?`,
    choices: ['Exactly one solution', 'No solution', 'Infinitely many solutions'].map((t) => ({ text: t, correct: t === ans })),
    explain:
      det !== 0
        ? `$\\det = (${a})(${d}) - (${b})(${c}) = ${det} \\neq 0$, so the lines cross once.`
        : `$\\det = 0$: the second left-hand side is $${k}\\times$ the first, so the lines are parallel. ${ans === 'No solution' ? `But $${f} \\neq ${k}\\times${e}$, so they never meet: **no solution**.` : `And $${f} = ${k}\\times${e}$ too: it's the same line, so **infinitely many** solutions.`}`,
  };
};

export const genElimMultiplier: Gen = () => {
  const p = pick([1, 2, -2, 3, 4]), m = pick([2, -1, 3, -3, 0.5, 1.5]);
  const t = p * m;
  const r1 = [p, randInt(-4, 4), randInt(-4, 4), randInt(-6, 6)];
  const r2 = [t, randInt(-4, 4), randInt(-4, 4), randInt(-6, 6)];
  return {
    kind: 'num',
    prompt: `In Gaussian elimination, we want a zero in position (2,1). What multiplier ${$('m')} do we use in ${$('R_2 \\leftarrow R_2 - m\\,R_1')}?`,
    visual: <MatrixView m={[r1, r2]} aug={3} pivot={[0, 0]} hiCells={[[1, 0]]} />,
    answer: m,
    explain: `$m = \\frac{\\text{entry to eliminate}}{\\text{pivot}} = \\frac{${fmt(t)}}{${p}} = ${fmt(m)}$. Then the new $(2,1)$ entry is $${fmt(t)} - ${fmt(m)}\\times${p} = 0$ ✓.`,
  };
};

export const genBackSub: Gen = () => {
  const x = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
  const U = [[pick([1, 2, -1]), randInt(-3, 3), randInt(-3, 3)], [0, pick([1, 2, 3]), randInt(-3, 3)], [0, 0, pick([1, 2, -2, 4])]];
  const c = U.map((r) => r.reduce((s, v, j) => s + v * x[j], 0));
  const which = pick([0, 1]);
  return {
    kind: 'num',
    prompt: `Back-substitute to find ${$(`x_${which + 1}`)} in the upper triangular system ${$('[U \\mid \\mathbf c]')}:`,
    visual: <MatrixView m={U.map((r, i) => [...r, c[i]])} aug={3} />,
    answer: x[which],
    explain: `Bottom row first: $x_3 = \\frac{${c[2]}}{${U[2][2]}} = ${x[2]}$. Row 2: $x_2 = \\frac{${c[1]} - (${U[1][2]})(${x[2]})}{${U[1][1]}} = ${x[1]}$.${which === 0 ? ` Row 1: $x_1 = \\frac{${c[0]} - (${U[0][1]})(${x[1]}) - (${U[0][2]})(${x[2]})}{${U[0][0]}} = ${x[0]}$.` : ''}`,
  };
};

/* ───────────── Week 5 · LU & error ───────────── */

export const genLUEntry: Gen = () => {
  const p = pick([2, 3, 4, -2]), m = pick([2, -1, 3, 0.5, -3]);
  const A = [[p, randInt(-3, 3)], [p * m, randInt(-3, 3)]];
  return {
    kind: 'num',
    prompt: `In the LU factorisation ${$('A = LU')} (no pivoting) of the matrix below, what is ${$('l_{21}')}?`,
    visual: <MatrixView m={A} label="A" />,
    answer: m,
    explain: `$L$ stores the elimination multipliers: $l_{21} = \\frac{a_{21}}{a_{11}} = \\frac{${fmt(p * m)}}{${p}} = ${fmt(m)}$.`,
  };
};

export const genForwardSub: Gen = () => {
  const l = randNonZero(-3, 3), b1 = randInt(-6, 6), b2 = randInt(-6, 6);
  const y2 = b2 - l * b1;
  return {
    kind: 'num',
    prompt: `Solve ${$('L\\mathbf y = \\mathbf b')} by forward substitution. What is ${$('y_2')}?`,
    visual: (
      <div className="matrix-pair">
        <MatrixView m={[[1, 0], [l, 1]]} label="L" />
        <MatrixView m={[[b1], [b2]]} label="b" />
      </div>
    ),
    answer: y2,
    explain: `Top row: $y_1 = ${b1}$. Second row: $${l}y_1 + y_2 = ${b2}$, so $y_2 = ${b2} - (${l})(${b1}) = ${y2}$.`,
  };
};

export const genRelError: Gen = () => {
  const tv = pick([Math.PI, Math.E, Math.SQRT2, 1 / 3]);
  const name = tv === Math.PI ? '\\pi' : tv === Math.E ? 'e' : tv === Math.SQRT2 ? '\\sqrt2' : '\\tfrac13';
  const approx = Number(tv.toFixed(pick([1, 2, 3])));
  const rel = Math.abs(tv - approx) / Math.abs(tv);
  return {
    kind: 'num',
    prompt: `${$(name)} is approximated by ${$(`${approx}`)}. What is the **relative** error, as a percentage? (2 d.p.)`,
    answer: rel * 100,
    tol: 0.006,
    explain: `$\\frac{|x - \\hat x|}{|x|} = \\frac{|${fmt(tv, 6)} - ${approx}|}{${fmt(tv, 6)}} = ${rel.toExponential(3)} \\approx ${fmt(rel * 100, 3)}\\%$`,
  };
};

export const genCond: Gen = () => {
  const a = pick([1, 2, 4, 5, 10]), d = pick([0.1, 0.5, 2, 0.01, 20]);
  const k = Math.max(a, d) / Math.min(a, d);
  return {
    kind: 'num',
    prompt: `What is ${$('\\kappa_\\infty(A) = \\|A\\|_\\infty\\|A^{-1}\\|_\\infty')} for ${$(`A = \\begin{pmatrix} ${a} & 0 \\\\ 0 & ${d} \\end{pmatrix}`)}?`,
    answer: k,
    tol: 0.01,
    explain: `$\\|A\\|_\\infty = \\max(${a}, ${d}) = ${Math.max(a, d)}$. $A^{-1} = \\text{diag}(\\frac1{${a}}, \\frac1{${d}})$, so $\\|A^{-1}\\|_\\infty = ${fmt(1 / Math.min(a, d), 4)}$. Product: $${fmt(k)}$. ${k > 100 ? 'Large: this system amplifies errors.' : ''}`,
  };
};

export const genResidual: Gen = () => {
  const A = [[randInt(1, 4), randInt(-2, 2)], [randInt(-2, 2), randInt(1, 4)]];
  const xt = [randInt(-2, 3), randInt(-2, 3)];
  const b = A.map((r) => r[0] * xt[0] + r[1] * xt[1]);
  const xh = [xt[0] + pick([0.1, -0.1, 0.2]), xt[1]];
  const i = pick([0, 1]);
  const r = b[i] - (A[i][0] * xh[0] + A[i][1] * xh[1]);
  return {
    kind: 'num',
    prompt: `A solver returns ${$(`\\hat{\\mathbf x} = (${fmt(xh[0])}, ${fmt(xh[1])})`)} for the system below. Compute residual component ${$(`r_${i + 1}`)} of ${$('\\mathbf r = \\mathbf b - A\\hat{\\mathbf x}')}.`,
    visual: (
      <div className="matrix-pair">
        <MatrixView m={A} label="A" hiRows={[i]} />
        <MatrixView m={b.map((v) => [v])} label="b" hiRows={[i]} />
      </div>
    ),
    answer: r,
    explain: `$r_${i + 1} = b_${i + 1} - (a_{${i + 1}1}\\hat x_1 + a_{${i + 1}2}\\hat x_2) = ${b[i]} - (${A[i][0]}\\times${fmt(xh[0])} + ${A[i][1]}\\times${fmt(xh[1])}) = ${fmt(r, 4)}$`,
  };
};

export const genFloat: Gen = () => {
  const q = pick([
    { p: 'In double precision, what does `0.1 + 0.2 == 0.3` give?', a: 'false (0)', w: ['true (1)', 'an error', '0.3'], e: '0.1 and 0.2 have no exact binary representation, so the sum is 0.30000000000000004. **Never** compare floats with `==`; use `abs(a - b) < tol`.' },
    { p: 'Machine epsilon for double precision is about…', a: '$2.2\\times10^{-16}$', w: ['$10^{-8}$', '$0$', '$1.2\\times10^{-38}$'], e: '$\\varepsilon = 2^{-52} \\approx 2.2\\times10^{-16}$: the gap between 1 and the next representable number. About 16 significant digits.' },
    { p: 'A system has $\\kappa(A) \\approx 10^{10}$ and you compute with about 16 digits. Roughly how many digits of the answer can you trust?', a: 'about 6', w: ['all 16', 'about 10', 'none at all'], e: 'You lose about $\\log_{10}\\kappa = 10$ digits, leaving $16 - 10 = 6$.' },
  ]);
  return {
    kind: 'mcq',
    prompt: q.p,
    choices: [{ text: q.a, correct: true }, ...q.w.map((w) => ({ text: w }))],
    explain: q.e,
  };
};

/* ───────────── Week 7 · Iterative methods ───────────── */

export const genJacobiStep: Gen = () => {
  const a11 = pick([4, 5, 8, 10]), a22 = pick([4, 5, 8, 10]), a12 = randNonZero(-2, 2), a21 = randNonZero(-2, 2);
  const b1 = randInt(-10, 12), b2 = randInt(-10, 12);
  const x0 = [randInt(-2, 2), randInt(-2, 2)];
  const which = pick([0, 1]);
  const v = which === 0 ? (b1 - a12 * x0[1]) / a11 : (b2 - a21 * x0[0]) / a22;
  return {
    kind: 'num',
    prompt: `Jacobi on ${$(sys2(a11, a12, a21, a22, b1, b2))} from ${$(`\\mathbf x^{(0)} = (${x0.join(', ')})`)}. Find ${$(which === 0 ? 'x^{(1)}' : 'y^{(1)}')}.`,
    answer: v,
    explain:
      which === 0
        ? `Solve equation 1 for $x$ using the **old** $y$: $x^{(1)} = \\frac{${b1} - (${a12})(${x0[1]})}{${a11}} = ${fmt(v, 4)}$.`
        : `Solve equation 2 for $y$ using the **old** $x$: $y^{(1)} = \\frac{${b2} - (${a21})(${x0[0]})}{${a22}} = ${fmt(v, 4)}$.`,
  };
};

export const genGSStep: Gen = () => {
  const a11 = pick([4, 5, 10]), a22 = pick([4, 5, 10]), a12 = randNonZero(-2, 2), a21 = randNonZero(-2, 2);
  const b1 = randInt(-10, 12), b2 = randInt(-10, 12);
  const x1 = b1 / a11;
  const y1 = (b2 - a21 * x1) / a22;
  return {
    kind: 'num',
    prompt: `Gauss–Seidel on ${$(sys2(a11, a12, a21, a22, b1, b2))} from ${$('\\mathbf x^{(0)} = (0, 0)')}. Find ${$('y^{(1)}')}.`,
    answer: y1,
    explain: `First $x^{(1)} = \\frac{${b1} - (${a12})(0)}{${a11}} = ${fmt(x1, 4)}$. Gauss–Seidel uses this **new** $x$ straight away: $y^{(1)} = \\frac{${b2} - (${a21})(${fmt(x1, 4)})}{${a22}} = ${fmt(y1, 4)}$. (Jacobi would have used $x = 0$.)`,
  };
};

export const genDiagDom: Gen = () => {
  const dom = Math.random() < 0.5;
  const M = [0, 1, 2].map((i) => {
    const off = [randInt(-3, 3), randInt(-3, 3)];
    const sum = Math.abs(off[0]) + Math.abs(off[1]);
    const diag = dom ? sum + randInt(1, 3) : i === 1 ? Math.max(1, sum - randInt(0, 1)) : sum + randInt(1, 3);
    const row = [0, 0, 0];
    row[i] = diag;
    row[(i + 1) % 3] = off[0];
    row[(i + 2) % 3] = off[1];
    return row;
  });
  const isDom = M.every((r, i) => Math.abs(r[i]) > r.reduce((s, v, j) => (j === i ? s : s + Math.abs(v)), 0));
  return {
    kind: 'mcq',
    prompt: 'Is this matrix strictly diagonally dominant?',
    visual: <MatrixView m={M} hiCells={[[0, 0], [1, 1], [2, 2]]} />,
    choices: [{ text: 'Yes: Jacobi and Gauss–Seidel are guaranteed to converge', correct: isDom }, { text: 'No: at least one row fails the test', correct: !isDom }],
    explain: `For each row check $|a_{ii}| > \\sum_{j\\ne i}|a_{ij}|$. ${M.map((r, i) => `Row ${i + 1}: $${Math.abs(r[i])}$ vs $${r.reduce((s, v, j) => (j === i ? s : s + Math.abs(v)), 0)}$`).join('; ')}. ${isDom ? 'All pass.' : 'Not every row passes (convergence is then not guaranteed, though it may still happen).'}`,
  };
};

export const genFixedPoint: Gen = () => {
  const kind = pick(['lin', 'sqrt'] as const);
  if (kind === 'lin') {
    const a = pick([0.5, 0.25, -0.5]), c = randInt(1, 4), x0 = randInt(-2, 4);
    const x2 = a * (a * x0 + c) + c;
    return {
      kind: 'num',
      prompt: `Fixed-point iteration ${$(`x_{k+1} = ${a}x_k + ${c}`)} from ${$(`x_0 = ${x0}`)}. Find ${$('x_2')}.`,
      answer: x2,
      explain: `$x_1 = ${a}(${x0}) + ${c} = ${fmt(a * x0 + c)}$, $x_2 = ${a}(${fmt(a * x0 + c)}) + ${c} = ${fmt(x2)}$. It converges to $x^* = \\frac{${c}}{1 - (${a})} = ${fmt(c / (1 - a), 3)}$ because $|g'| = ${Math.abs(a)} < 1$.`,
    };
  }
  const A = pick([2, 3, 5, 10]), x0 = pick([1, 2, 3]);
  const x1 = (x0 + A / x0) / 2;
  return {
    kind: 'num',
    prompt: `${$(`x_{k+1} = \\tfrac12\\left(x_k + \\tfrac{${A}}{x_k}\\right)`)} from ${$(`x_0 = ${x0}`)}. Find ${$('x_1')} (3 d.p.).`,
    answer: x1,
    tol: 0.001,
    explain: `$x_1 = \\frac12\\left(${x0} + \\frac{${A}}{${x0}}\\right) = ${fmt(x1, 4)}$. This converges to $\\sqrt{${A}} \\approx ${fmt(Math.sqrt(A), 4)}$ (it's Newton's method!).`,
  };
};

export const genConverge: Gen = () => {
  const g = pick([
    { tex: '\\tfrac{x}{3} + 2', d: 1 / 3, ok: true },
    { tex: '2x - 1', d: 2, ok: false },
    { tex: '\\cos x', d: 0.67, ok: true },
    { tex: '-1.5x + 5', d: 1.5, ok: false },
    { tex: '0.9x + 0.1', d: 0.9, ok: true },
  ]);
  return {
    kind: 'mcq',
    prompt: `Will ${$(`x_{k+1} = ${g.tex}`)} converge to its fixed point (starting nearby)?`,
    choices: [{ text: 'Yes', correct: g.ok }, { text: 'No', correct: !g.ok }],
    explain: `Check $|g'(x^*)|$: here it is about $${fmt(g.d, 2)}$. ${g.ok ? 'Less than 1, so errors shrink each step: **converges**.' : 'Greater than 1, so errors grow each step: **diverges**.'}`,
  };
};

/* ───────────── Weeks 8–9 · Newton ───────────── */

export const genNewtonStep: Gen = () => {
  const a = pick([2, 3, 5, 7, 10]), x0 = pick([1, 2, 3]);
  const kind = pick(['sq', 'cube'] as const);
  if (kind === 'sq') {
    const x1 = x0 - (x0 * x0 - a) / (2 * x0);
    return {
      kind: 'num',
      prompt: `One Newton step for ${$(`f(x) = x^2 - ${a}`)} from ${$(`x_0 = ${x0}`)}. Find ${$('x_1')} (3 d.p.).`,
      answer: x1,
      tol: 0.001,
      explain: `$f'(x) = 2x$. $x_1 = x_0 - \\frac{f(x_0)}{f'(x_0)} = ${x0} - \\frac{${x0 * x0 - a}}{${2 * x0}} = ${fmt(x1, 4)}$.`,
    };
  }
  const x1 = x0 - (x0 ** 3 - a) / (3 * x0 * x0);
  return {
    kind: 'num',
    prompt: `One Newton step for ${$(`f(x) = x^3 - ${a}`)} from ${$(`x_0 = ${x0}`)}. Find ${$('x_1')} (3 d.p.).`,
    answer: x1,
    tol: 0.001,
    explain: `$f'(x) = 3x^2$. $x_1 = ${x0} - \\frac{${x0 ** 3 - a}}{${3 * x0 * x0}} = ${fmt(x1, 4)}$.`,
  };
};

export const genNewtonFail: Gen = () => {
  const q = pick([
    { p: "Newton's method for $f(x) = x^2 - 4$ is started at $x_0 = 0$. What happens?", a: 'It fails immediately: $f\'(0) = 0$, division by zero', w: ['It converges to 2', 'It converges to −2', 'It converges to 0'] },
    { p: "Near a simple root, how does Newton's error behave?", a: 'Roughly squares each step (quadratic convergence)', w: ['Halves each step', 'Decreases by a constant amount', 'Stays the same'] },
    { p: 'Which method needs a bracket $[a, b]$ with $f(a)f(b) < 0$ but is guaranteed to converge?', a: 'Bisection', w: ["Newton's method", 'Secant method', 'Fixed-point iteration'] },
  ]);
  return {
    kind: 'mcq',
    prompt: q.p,
    choices: [{ text: q.a, correct: true }, ...q.w.map((w) => ({ text: w }))],
    explain: "Newton divides by $f'(x_n)$, so a flat tangent is fatal. When it works it converges quadratically (correct digits double). Bisection is slow (error halves) but safe.",
  };
};

export const genJacobianEntry: Gen = () => {
  const a = randInt(1, 3), b = randInt(1, 3), p = randInt(-2, 2), q = randInt(-2, 3);
  const which = pick(['11', '12', '21', '22'] as const);
  const vals = { '11': 2 * a * p, '12': b, '21': q, '22': p };
  return {
    kind: 'num',
    prompt: `${$(`\\mathbf F(x,y) = \\begin{pmatrix} ${a === 1 ? '' : a}x^2 + ${b === 1 ? '' : b}y \\\\ xy - 1 \\end{pmatrix}`)}. Find Jacobian entry ${$(`J_{${which}}`)} at ${$(`(${p}, ${q})`)}.`,
    answer: vals[which],
    explain: `$J = \\begin{pmatrix} \\partial f_1/\\partial x & \\partial f_1/\\partial y \\\\ \\partial f_2/\\partial x & \\partial f_2/\\partial y \\end{pmatrix} = \\begin{pmatrix} ${2 * a}x & ${b} \\\\ y & x \\end{pmatrix}$. At $(${p}, ${q})$: $\\begin{pmatrix} ${2 * a * p} & ${b} \\\\ ${q} & ${p} \\end{pmatrix}$, so $J_{${which}} = ${vals[which]}$.`,
  };
};

export const genNewton2D: Gen = () => {
  const a = pick([4, 9, 16]), c = randInt(-3, 3), x0 = pick([1, 2, 3]), y0 = randInt(-2, 2);
  // F = (x^2 - a, y - c): decoupled so the step is easy to do by hand
  const x1 = x0 - (x0 * x0 - a) / (2 * x0);
  return {
    kind: 'num',
    prompt: `Newton for ${$(`\\mathbf F(x,y) = (x^2 - ${a},\\ y - ${c})`)} from ${$(`(${x0}, ${y0})`)}. Find ${$('x_1')} (3 d.p.).`,
    answer: x1,
    tol: 0.001,
    explain: `$J = \\begin{pmatrix} 2x & 0 \\\\ 0 & 1 \\end{pmatrix}$, so $J\\Delta = -\\mathbf F$ splits: $2(${x0})\\Delta x = -(${x0 * x0 - a})$, giving $\\Delta x = ${fmt(x1 - x0, 4)}$ and $x_1 = ${fmt(x1, 4)}$. (And $y_1 = ${c}$ in one step, because $f_2$ is linear.)`,
  };
};

/* ───────────── Weeks 10–11 · Numerical integration ───────────── */

const IPOOL = [
  { tex: 'x^2', f: (x: number) => x * x },
  { tex: 'x^3', f: (x: number) => x ** 3 },
  { tex: '\\tfrac{1}{x}', f: (x: number) => 1 / x },
  { tex: '2^x', f: (x: number) => 2 ** x },
];

export const genTrap: Gen = () => {
  const F = pick(IPOOL), a = F.tex.includes('frac') ? 1 : 0, n = pick([2, 4]), h = pick([0.5, 1]);
  const b = a + n * h;
  const ys = Array.from({ length: n + 1 }, (_, i) => F.f(a + i * h));
  const T = h * (ys[0] / 2 + ys.slice(1, -1).reduce((s, v) => s + v, 0) + ys[n] / 2);
  return {
    kind: 'num',
    prompt: `Estimate ${$(`\\int_{${a}}^{${b}} ${F.tex}\\,dx`)} using the trapezium rule with ${$(`n = ${n}`)} strips (3 d.p.).`,
    answer: T,
    tol: 0.002,
    explain: `$h = ${h}$, values $f_i$: ${ys.map((y) => fmt(y, 4)).join(', ')}. $$T = ${h}\\Big[\\tfrac{${fmt(ys[0], 4)}}{2} + ${ys.slice(1, -1).map((y) => fmt(y, 4)).join(' + ')} + \\tfrac{${fmt(ys[n], 4)}}{2}\\Big] = ${fmt(T, 4)}$$`,
  };
};

export const genSimpson: Gen = () => {
  const F = pick(IPOOL), a = F.tex.includes('frac') ? 1 : 0, h = pick([0.5, 1]);
  const b = a + 2 * h;
  const [f0, f1, f2] = [F.f(a), F.f(a + h), F.f(b)];
  const S = (h / 3) * (f0 + 4 * f1 + f2);
  return {
    kind: 'num',
    prompt: `Estimate ${$(`\\int_{${a}}^{${b}} ${F.tex}\\,dx`)} with Simpson's rule, ${$('n = 2')} strips (3 d.p.).`,
    answer: S,
    tol: 0.002,
    explain: `$h = ${h}$. $$S = \\frac{h}{3}\\big[f_0 + 4f_1 + f_2\\big] = \\frac{${h}}{3}\\big[${fmt(f0, 4)} + 4(${fmt(f1, 4)}) + ${fmt(f2, 4)}\\big] = ${fmt(S, 4)}$$${F.tex.startsWith('x^') ? ' Exact, because Simpson integrates cubics perfectly!' : ''}`,
  };
};

export const genOrder: Gen = () => {
  const rule = pick(['trapezium', 'Simpson'] as const);
  const factor = rule === 'trapezium' ? 4 : 16;
  return {
    kind: 'mcq',
    prompt: `You halve the step size ${$('h')} in the composite ${rule} rule. Roughly what happens to the error (smooth ${$('f')})?`,
    choices: [`Divided by ${factor}`, `Divided by ${factor === 4 ? 2 : 4}`, `Divided by ${factor === 4 ? 8 : 32}`, 'It stays about the same'].map((t, i) => ({ text: t, correct: i === 0 })),
    explain: `${rule === 'trapezium' ? 'Trapezium error is $O(h^2)$: $(\\tfrac12)^2 = \\tfrac14$.' : 'Simpson error is $O(h^4)$: $(\\tfrac12)^4 = \\tfrac1{16}$.'}`,
  };
};

export const genMC: Gen = () => {
  const N = pick([200, 500, 1000]), frac = pick([0.3, 0.45, 0.6, 0.72]);
  const hits = Math.round(N * frac), W = pick([2, 3, 4]), H = pick([1, 2, 5]);
  return {
    kind: 'num',
    prompt: `You throw ${N} random darts into the box ${$(`[0, ${W}]\\times[0, ${H}]`)} and ${hits} land under the curve. Estimate the area under the curve.`,
    answer: (hits / N) * W * H,
    tol: 0.01,
    explain: `Area $\\approx \\frac{\\text{hits}}{N}\\times\\text{box area} = \\frac{${hits}}{${N}}\\times${W * H} = ${fmt((hits / N) * W * H, 3)}$.`,
  };
};

export const NUM_GENS = {
  linsys: [genSolve2x2, genClassify2x2, genElimMultiplier, genBackSub],
  lu: [genLUEntry, genForwardSub, genRelError, genCond, genResidual, genFloat],
  iterative: [genJacobiStep, genGSStep, genDiagDom, genFixedPoint, genConverge],
  newton: [genNewtonStep, genNewtonFail, genJacobianEntry, genNewton2D],
  numint: [genTrap, genSimpson, genOrder, genMC],
};

