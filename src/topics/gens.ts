import type { Gen } from '../components/Quiz';
import { fmt, fracTex, pick, polyTex, randInt, randNonZero, signed, termTex } from '../lib/math';

const $ = (s: string) => `$${s}$`;
const coefTerm = (c: number, n: number) => (c < 0 ? '-' : '') + termTex(c, n);

/* ───────────── Week 7 · Gradient & differentiation ───────────── */

export const genPowerRule: Gen = () => {
  const a = randInt(1, 9);
  const n = randInt(2, 7);
  const f = coefTerm(a, n);
  return {
    kind: 'mcq',
    prompt: `Differentiate ${$(`f(x) = ${f}`)}`,
    choices: [
      { text: $(`f'(x) = ${coefTerm(a * n, n - 1)}`), correct: true },
      { text: $(`f'(x) = ${coefTerm(a * n, n)}`) },
      { text: $(`f'(x) = ${coefTerm(a, n - 1)}`) },
      { text: $(`f'(x) = ${coefTerm(a * (n - 1), n - 1)}`) },
      { text: $(`f'(x) = \\frac{${a}}{${n + 1}}x^{${n + 1}}`) },
    ].slice(0, 4),
    explain: `Power rule: bring the power down and multiply, then knock the power down by one: $$\\frac{d}{dx}\\,ax^n = a\\,n\\,x^{n-1}$$ So ${$(`${a}\\cdot ${n}\\,x^{${n}-1} = ${coefTerm(a * n, n - 1)}`)}.`,
  };
};

export const genPolyDeriv: Gen = () => {
  const a = randNonZero(-4, 5), b = randNonZero(-6, 6), c = randNonZero(-9, 9), d = randInt(-9, 9);
  const f = polyTex([[a, 3], [b, 2], [c, 1], [d, 0]]);
  const right = polyTex([[3 * a, 2], [2 * b, 1], [c, 0]]);
  return {
    kind: 'mcq',
    prompt: `Find ${$("f'(x)")} for ${$(`f(x) = ${f}`)}`,
    choices: [
      { text: $(right), correct: true },
      { text: $(d !== 0 ? polyTex([[3 * a, 2], [2 * b, 1], [c, 0]]) + signed(d) : polyTex([[3 * a, 2], [b, 1], [c, 0]])) },
      { text: $(polyTex([[3 * a, 3], [2 * b, 2], [c, 1]])) },
      { text: $(polyTex([[a, 2], [b, 1], [c, 0]])) },
      { text: $(polyTex([[3 * a, 2], [2 * b, 1], [0, 0]])) },
    ].filter((ch) => ch.correct || ch.text !== $(right)).slice(0, 4),
    explain: `Differentiate term by term. Each $ax^n$ becomes $anx^{n-1}$, the $x$ term becomes its coefficient, and the constant ${$(`${d}`)} disappears (a flat line has slope 0). $$f'(x) = ${right}$$`,
  };
};

export const genSlopeAt: Gen = () => {
  const a = randNonZero(-3, 4), b = randInt(-6, 6), c = randInt(-5, 5), k = randInt(-3, 3);
  const ans = 2 * a * k + b;
  return {
    kind: 'num',
    prompt: `What is the gradient of the tangent to ${$(`y = ${polyTex([[a, 2], [b, 1], [c, 0]])}`)} at ${$(`x = ${k}`)}?`,
    answer: ans,
    explain: `Gradient of the tangent = the derivative at that point. $$\\frac{dy}{dx} = ${polyTex([[2 * a, 1], [b, 0]])}$$ At $x = ${k}$: $${2 * a}(${k})${b < 0 ? '' : '+'}${b} = ${ans}$.`,
  };
};

export const genLineGradient: Gen = () => {
  const x1 = randInt(-5, 3), y1 = randInt(-5, 5);
  const run = pick([1, 2, 4, 5]);
  const m = pick([-3, -2, -1.5, -0.5, 0.5, 1, 2, 3, 0.25]);
  const x2 = x1 + run, y2 = y1 + m * run;
  return {
    kind: 'num',
    prompt: `A straight line passes through ${$(`(${x1}, ${y1})`)} and ${$(`(${x2}, ${fmt(y2)})`)}. What is its gradient?`,
    answer: m,
    explain: `Gradient = rise over run: $$m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${fmt(y2)} - (${y1})}{${x2} - (${x1})} = \\frac{${fmt(y2 - y1)}}{${run}} = ${fmt(m)}$$`,
  };
};

const SPECIAL_D = [
  { f: '\\sin x', d: '\\cos x', wrong: ['-\\cos x', '-\\sin x', '\\sin x'] },
  { f: '\\cos x', d: '-\\sin x', wrong: ['\\sin x', '-\\cos x', '\\cos x'] },
  { f: 'e^{x}', d: 'e^{x}', wrong: ['xe^{x-1}', '\\ln x', 'e^{x-1}'] },
  { f: '\\ln x', d: '\\frac{1}{x}', wrong: ['e^{x}', 'x\\ln x - x', '\\frac{1}{x^2}'] },
  { f: 'e^{3x}', d: '3e^{3x}', wrong: ['e^{3x}', '3xe^{3x-1}', '\\frac{1}{3}e^{3x}'] },
  { f: '\\sqrt{x}', d: '\\frac{1}{2\\sqrt{x}}', wrong: ['\\frac{1}{\\sqrt{x}}', '2\\sqrt{x}', '\\frac{2}{3}x^{3/2}'] },
  { f: '\\frac{1}{x}', d: '-\\frac{1}{x^2}', wrong: ['\\ln x', '\\frac{1}{x^2}', '-\\frac{1}{x}'] },
];

export const genSpecialDeriv: Gen = () => {
  const s = pick(SPECIAL_D);
  return {
    kind: 'mcq',
    prompt: `${$(`\\dfrac{d}{dx}\\left(${s.f}\\right) = \\;?`)}`,
    choices: [{ text: $(s.d), correct: true }, ...s.wrong.map((w) => ({ text: $(w) }))],
    explain: `This one's a standard result worth memorising: $$\\frac{d}{dx}\\left(${s.f}\\right) = ${s.d}$$ Tip: $\\sqrt{x} = x^{1/2}$ and $\\frac1x = x^{-1}$, so those two are just the power rule in disguise.`,
  };
};

/* ───────────── Week 8 · Min & max ───────────── */

export const genStationaryQuad: Gen = () => {
  const a = randNonZero(-3, 3), h = randInt(-4, 4), k = randInt(-5, 5);
  const b = -2 * a * h, c = a * h * h + k;
  return {
    kind: 'num',
    prompt: `Find the ${$('x')}-coordinate of the stationary point of ${$(`f(x) = ${polyTex([[a, 2], [b, 1], [c, 0]])}`)}.`,
    answer: h,
    explain: `Stationary means slope zero, so solve $f'(x) = 0$: $$f'(x) = ${polyTex([[2 * a, 1], [b, 0]])} = 0 \\;\\Rightarrow\\; x = ${h}$$ Since $f''(x) = ${2 * a} ${a > 0 ? '> 0' : '< 0'}$, it's a **${a > 0 ? 'minimum' : 'maximum'}**.`,
  };
};

export const genSecondDerivTest: Gen = () => {
  const v = pick([-6, -2, -0.5, 0, 3, 8, 1.5]);
  const x0 = randInt(-3, 3);
  const right = v > 0 ? 'Local minimum' : v < 0 ? 'Local maximum' : 'Test is inconclusive';
  return {
    kind: 'mcq',
    prompt: `At ${$(`x = ${x0}`)} we know ${$(`f'(${x0}) = 0`)} and ${$(`f''(${x0}) = ${fmt(v)}`)}. What kind of stationary point is it?`,
    choices: ['Local minimum', 'Local maximum', 'Test is inconclusive', 'Not a stationary point'].map((t) => ({ text: t, correct: t === right })),
    explain: `Second derivative test: $f'' > 0$ means the curve bends upward like a cup ∪, so a **minimum**; $f'' < 0$ means it bends down like a cap ∩, so a **maximum**; $f'' = 0$ tells you nothing, so check the sign of $f'$ either side. Here $f''(${x0}) = ${fmt(v)}$, so: **${right}**.`,
  };
};

export const genCubicStationary: Gen = () => {
  const p = randInt(1, 3), c = randInt(-4, 4);
  const lin = -3 * p * p;
  return {
    kind: 'mcq',
    prompt: `Where are the stationary points of ${$(`f(x) = ${polyTex([[1, 3], [lin, 1], [c, 0]])}`)}?`,
    choices: [
      { text: $(`x = \\pm ${p}`), correct: true },
      { text: $(`x = 0,\\; x = ${3 * p * p}`) },
      { text: $(`x = ${p}\\text{ only}`) },
      { text: $(`x = \\pm ${3 * p}`) },
    ],
    explain: `$$f'(x) = 3x^2 ${lin < 0 ? '-' : '+'} ${Math.abs(lin)} = 3(x^2 - ${p * p}) = 0 \\Rightarrow x = \\pm ${p}$$ And $f''(x) = 6x$, so $x = ${p}$ is a minimum ($f'' > 0$) and $x = -${p}$ is a maximum.`,
  };
};

export const genGDStep: Gen = () => {
  const b = randInt(-6, 6), x0 = randInt(-3, 4), alpha = pick([0.1, 0.25, 0.5]);
  const grad = 2 * x0 + b;
  const x1 = x0 - alpha * grad;
  return {
    kind: 'num',
    prompt: `Gradient descent on ${$(`L(x) = ${polyTex([[1, 2], [b, 1]])}`)}. Start at ${$(`x_0 = ${x0}`)} with learning rate ${$(`\\alpha = ${alpha}`)}. What is ${$('x_1')}?`,
    answer: x1,
    hint: 'Update rule: $x_1 = x_0 - \\alpha\\,L\'(x_0)$',
    explain: `$L'(x) = ${polyTex([[2, 1], [b, 0]])}$, so $L'(${x0}) = ${grad}$. $$x_1 = x_0 - \\alpha L'(x_0) = ${x0} - ${alpha}\\times(${grad}) = ${fmt(x1)}$$ This is literally one training step of a neural network, in 1-D.`,
  };
};

/* ───────────── Week 9 · Chain rule & partials ───────────── */

export const genChain: Gen = () => {
  const a = randInt(2, 5), b = randNonZero(-5, 5), n = randInt(2, 6);
  const inner = polyTex([[a, 1], [b, 0]]);
  return {
    kind: 'mcq',
    prompt: `Differentiate ${$(`y = (${inner})^{${n}}`)}`,
    choices: [
      { text: $(`${n * a}(${inner})^{${n - 1}}`), correct: true },
      { text: $(`${n}(${inner})^{${n - 1}}`) },
      { text: $(`${n * a}(${inner})^{${n}}`) },
      { text: $(`${a}(${inner})^{${n - 1}}`) },
    ],
    explain: `Chain rule, "outside then inside": let $u = ${inner}$, so $y = u^{${n}}$. $$\\frac{dy}{dx} = \\underbrace{${n}u^{${n - 1}}}_{\\text{outer}'}\\cdot\\underbrace{${a}}_{\\text{inner}'} = ${n * a}(${inner})^{${n - 1}}$$ Forgetting the inner derivative (${a}) is the #1 chain-rule mistake.`,
  };
};

export const genChainExp: Gen = () => {
  const a = randInt(2, 5);
  const kind = pick(['exp', 'sin', 'ln'] as const);
  if (kind === 'exp')
    return {
      kind: 'mcq',
      prompt: `Differentiate ${$(`y = e^{${a}x^2}`)}`,
      choices: [
        { text: $(`${2 * a}x\\,e^{${a}x^2}`), correct: true },
        { text: $(`e^{${a}x^2}`) },
        { text: $(`${a}x^2 e^{${a}x^2 - 1}`) },
        { text: $(`${2 * a}x\\,e^{${2 * a}x}`) },
      ],
      explain: `Inner $u = ${a}x^2$ has $u' = ${2 * a}x$. Outer $e^u$ differentiates to itself. Multiply: $$\\frac{dy}{dx} = e^{${a}x^2}\\cdot ${2 * a}x$$`,
    };
  if (kind === 'sin')
    return {
      kind: 'mcq',
      prompt: `Differentiate ${$(`y = \\sin(${a}x^2)`)}`,
      choices: [
        { text: $(`${2 * a}x\\cos(${a}x^2)`), correct: true },
        { text: $(`\\cos(${a}x^2)`) },
        { text: $(`${2 * a}x\\cos(${2 * a}x)`) },
        { text: $(`-${2 * a}x\\cos(${a}x^2)`) },
      ],
      explain: `Outer: $\\sin u \\to \\cos u$. Inner: $u = ${a}x^2 \\to ${2 * a}x$. $$\\frac{dy}{dx} = \\cos(${a}x^2)\\cdot ${2 * a}x$$`,
    };
  return {
    kind: 'mcq',
    prompt: `Differentiate ${$(`y = \\ln(x^2 + ${a})`)}`,
    choices: [
      { text: $(`\\dfrac{2x}{x^2 + ${a}}`), correct: true },
      { text: $(`\\dfrac{1}{x^2 + ${a}}`) },
      { text: $(`\\dfrac{1}{2x}`) },
      { text: $(`2x\\ln(x^2 + ${a})`) },
    ],
    explain: `Outer: $\\ln u \\to \\frac1u$. Inner: $u = x^2 + ${a} \\to 2x$. $$\\frac{dy}{dx} = \\frac{1}{x^2+${a}}\\cdot 2x = \\frac{2x}{x^2+${a}}$$`,
  };
};

export const genProduct: Gen = () => {
  const n = randInt(2, 5);
  const g = pick([
    { t: 'e^{x}', d: 'e^{x}' },
    { t: '\\sin x', d: '\\cos x' },
    { t: '\\ln x', d: '\\frac{1}{x}' },
  ]);
  return {
    kind: 'mcq',
    prompt: `Differentiate ${$(`y = x^{${n}}\\,${g.t}`)}`,
    choices: [
      { text: $(`${n}x^{${n - 1}}${g.t} + x^{${n}}${g.d}`), correct: true },
      { text: $(`${n}x^{${n - 1}}\\,${g.d}`) },
      { text: $(`${n}x^{${n - 1}}${g.t} - x^{${n}}${g.d}`) },
      { text: $(`x^{${n}}${g.d}`) },
    ],
    explain: `Product rule: $(uv)' = u'v + uv'$, so "derivative of the first times the second, plus the first times derivative of the second". With $u = x^{${n}}$, $v = ${g.t}$: $$y' = ${n}x^{${n - 1}}\\cdot ${g.t} + x^{${n}}\\cdot ${g.d}$$ You **can't** just multiply the two derivatives.`,
  };
};

export const genPartial: Gen = () => {
  const a = randInt(2, 5), b = randInt(1, 4), c = randNonZero(-6, 6);
  const wrt = pick(['x', 'y'] as const);
  const f = `${a}x^2y + ${b}y^3 ${c < 0 ? '-' : '+'} ${Math.abs(c)}x`;
  if (wrt === 'x')
    return {
      kind: 'mcq',
      prompt: `For ${$(`f(x,y) = ${f}`)}, find ${$('\\dfrac{\\partial f}{\\partial x}')}`,
      choices: [
        { text: $(`${2 * a}xy ${c < 0 ? '-' : '+'} ${Math.abs(c)}`), correct: true },
        { text: $(`${2 * a}xy + ${3 * b}y^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}`) },
        { text: $(`${a}x^2 + ${3 * b}y^2`) },
        { text: $(`${2 * a}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`) },
      ],
      explain: `Partial w.r.t. $x$: treat $y$ as a **constant number**. So $${a}x^2y \\to ${2 * a}xy$, the $${b}y^3$ term has no $x$ so it vanishes, and $${c}x \\to ${c}$. $$\\frac{\\partial f}{\\partial x} = ${2 * a}xy ${c < 0 ? '-' : '+'} ${Math.abs(c)}$$`,
    };
  return {
    kind: 'mcq',
    prompt: `For ${$(`f(x,y) = ${f}`)}, find ${$('\\dfrac{\\partial f}{\\partial y}')}`,
    choices: [
      { text: $(`${a}x^2 + ${3 * b}y^2`), correct: true },
      { text: $(`${2 * a}xy + ${3 * b}y^2`) },
      { text: $(`${a}x^2 + ${3 * b}y^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}`) },
      { text: $(`${3 * b}y^2`) },
    ],
    explain: `Partial w.r.t. $y$: treat $x$ as a **constant**. $${a}x^2y \\to ${a}x^2$ (like $5y \\to 5$), $${b}y^3 \\to ${3 * b}y^2$, and $${c}x$ has no $y$ so it vanishes. $$\\frac{\\partial f}{\\partial y} = ${a}x^2 + ${3 * b}y^2$$`,
  };
};

export const genGradientAt: Gen = () => {
  const a = randInt(1, 4), b = randNonZero(-3, 3), c = randInt(1, 4);
  const p = randInt(-2, 3), q = randInt(-2, 3);
  const wrt = pick(['x', 'y'] as const);
  const ans = wrt === 'x' ? 2 * a * p + b * q : b * p + 2 * c * q;
  const f = `${a === 1 ? '' : a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}xy + ${c === 1 ? '' : c}y^2`;
  return {
    kind: 'num',
    prompt: `For ${$(`f(x,y) = ${f}`)}, evaluate ${$(`\\dfrac{\\partial f}{\\partial ${wrt}}`)} at the point ${$(`(${p}, ${q})`)}.`,
    answer: ans,
    explain:
      wrt === 'x'
        ? `$\\frac{\\partial f}{\\partial x} = ${2 * a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}y$. Plug in: $${2 * a}(${p}) ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${q}) = ${ans}$.`
        : `$\\frac{\\partial f}{\\partial y} = ${b}x + ${2 * c}y$. Plug in: $${b}(${p}) + ${2 * c}(${q}) = ${ans}$.`,
  };
};

/* ───────────── Week 10 · Integration ───────────── */

export const genIntPower: Gen = () => {
  const n = randInt(1, 6), k = randInt(1, 4), a = k * (n + 1);
  return {
    kind: 'mcq',
    prompt: `${$(`\\displaystyle\\int ${a}x^{${n}}\\,dx = \\;?`)}`,
    choices: [
      { text: $(`${coefTerm(k, n + 1)} + C`), correct: true },
      { text: $(`${coefTerm(a * n, n - 1)} + C`) },
      { text: $(`${coefTerm(a, n + 1)} + C`) },
      { text: $(`${coefTerm(k, n + 1)}`) },
    ],
    explain: `Reverse power rule: add one to the power, divide by the new power, then add $+C$. $$\\int ${a}x^{${n}}\\,dx = \\frac{${a}}{${n + 1}}x^{${n + 1}} + C = ${coefTerm(k, n + 1)} + C$$ Without $+C$ it's marked wrong in an exam: any constant differentiates to 0, so there's a whole family of answers.`,
  };
};

export const genDefinite: Gen = () => {
  const p = randNonZero(-2, 3), q = randInt(-4, 4), r = randInt(-3, 5);
  const a = randInt(-1, 1), b = a + randInt(1, 3);
  const F = (x: number) => (p * x ** 3) / 3 + (q * x ** 2) / 2 + r * x;
  const ans = F(b) - F(a);
  const poly = polyTex([[p, 2], [q, 1], [r, 0]]);
  return {
    kind: 'num',
    prompt: `Evaluate ${$(`\\displaystyle\\int_{${a}}^{${b}} \\left(${poly}\\right)dx`)}`,
    answer: ans,
    tol: 0.02,
    hint: 'Fractions like 14/3 are fine.',
    explain: `Antiderivative: $F(x) = ${p ? `\\frac{${p}}{3}x^3` : ''}${q ? ` ${q < 0 ? '-' : '+'} \\frac{${Math.abs(q)}}{2}x^2` : ''}${r ? ` ${r < 0 ? '-' : '+'} ${Math.abs(r)}x` : ''}$. Then $$F(${b}) - F(${a}) = ${fmt(F(b), 4)} - (${fmt(F(a), 4)}) = ${fmt(ans, 4)}$$`,
  };
};

const SPECIAL_I = [
  { f: 'e^{x}', i: 'e^{x} + C', wrong: ['xe^{x} + C', 'e^{x+1} + C', '\\frac{e^{x+1}}{x+1} + C'] },
  { f: '\\cos x', i: '\\sin x + C', wrong: ['-\\sin x + C', '\\cos x + C', '-\\cos x + C'] },
  { f: '\\sin x', i: '-\\cos x + C', wrong: ['\\cos x + C', '-\\sin x + C', '\\sin x + C'] },
  { f: '\\frac{1}{x}', i: '\\ln|x| + C', wrong: ['\\frac{x^0}{0} + C', '-\\frac{1}{x^2} + C', 'e^{x} + C'] },
  { f: 'e^{4x}', i: '\\frac{1}{4}e^{4x} + C', wrong: ['4e^{4x} + C', 'e^{4x} + C', '\\frac{e^{4x+1}}{4x+1} + C'] },
];

export const genIntSpecial: Gen = () => {
  const s = pick(SPECIAL_I);
  return {
    kind: 'mcq',
    prompt: `${$(`\\displaystyle\\int ${s.f}\\,dx = \\;?`)}`,
    choices: [{ text: $(s.i), correct: true }, ...s.wrong.map((w) => ({ text: $(w) }))],
    explain: `Check by differentiating the answer: it must give back $${s.f}$. $$\\int ${s.f}\\,dx = ${s.i}$$ Note $\\int \\frac1x\\,dx$ is the one case where the power rule breaks (you'd divide by 0), which is why $\\ln$ shows up.`,
  };
};

export const genRiemann: Gen = () => {
  const n = pick([2, 4]);
  const b = pick([2, 4]);
  const method = pick(['left', 'right'] as const);
  const h = b / n;
  let s = 0;
  const xs: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = method === 'left' ? i * h : (i + 1) * h;
    xs.push(x);
    s += x * x * h;
  }
  return {
    kind: 'num',
    prompt: `Estimate ${$(`\\int_0^{${b}} x^2\\,dx`)} using ${n} ${method}-endpoint rectangles.`,
    answer: s,
    explain: `Width $h = \\frac{${b}}{${n}} = ${fmt(h)}$. Heights at the ${method} ends: ${xs.map((x) => `$f(${fmt(x)}) = ${fmt(x * x)}$`).join(', ')}. $$\\text{Sum} = ${fmt(h)}\\times(${xs.map((x) => fmt(x * x)).join(' + ')}) = ${fmt(s)}$$ Exact answer is $\\frac{${b ** 3}}{3} \\approx ${fmt(b ** 3 / 3)}$: ${method === 'left' ? 'left rectangles under-estimate an increasing function' : 'right rectangles over-estimate an increasing function'}.`,
  };
};

/* ───────────── Week 11 · Further integration ───────────── */

const SUB_CHOICES = [
  { int: '\\int 2x\\,(x^2+3)^5\\,dx', u: 'u = x^2 + 3', wrong: ['u = 2x', 'u = (x^2+3)^5', 'u = x'], why: 'Its derivative $2x$ is sitting right there as a factor.' },
  { int: '\\int x\\cos(x^2)\\,dx', u: 'u = x^2', wrong: ['u = \\cos(x^2)', 'u = x', 'u = \\cos x'], why: '$du = 2x\\,dx$ and an $x\\,dx$ is already present.' },
  { int: '\\int \\frac{\\ln x}{x}\\,dx', u: 'u = \\ln x', wrong: ['u = x', 'u = \\frac{1}{x}', 'u = x\\ln x'], why: '$du = \\frac1x dx$, which is exactly the rest of the integrand.' },
  { int: '\\int 3x^2 e^{x^3}\\,dx', u: 'u = x^3', wrong: ['u = e^{x^3}', 'u = 3x^2', 'u = x^2'], why: '$du = 3x^2\\,dx$ is already a factor.' },
  { int: '\\int \\frac{2x}{x^2+1}\\,dx', u: 'u = x^2 + 1', wrong: ['u = 2x', 'u = \\frac{1}{x^2+1}', 'u = x^2'], why: 'The top is the derivative of the bottom, so the answer is $\\ln(x^2+1)+C$.' },
];

export const genSubChoice: Gen = () => {
  const s = pick(SUB_CHOICES);
  return {
    kind: 'mcq',
    prompt: `Best substitution for ${$(s.int)}?`,
    choices: [{ text: $(s.u), correct: true }, ...s.wrong.map((w) => ({ text: $(w) }))],
    explain: `Look for an "inside function" whose derivative also appears as a factor. Here $${s.u}$: ${s.why}`,
  };
};

const PARTS_CHOICES = [
  { int: '\\int x e^{2x}\\,dx', u: 'u = x', dv: 'dv = e^{2x}dx', swap: 'u = e^{2x},\\; dv = x\\,dx', why: 'Algebraic beats Exponential in LIATE, and $x$ becomes 1 when differentiated.' },
  { int: '\\int x\\cos x\\,dx', u: 'u = x', dv: 'dv = \\cos x\\,dx', swap: 'u = \\cos x,\\; dv = x\\,dx', why: 'Algebraic beats Trig in LIATE.' },
  { int: '\\int x^3\\ln x\\,dx', u: 'u = \\ln x', dv: 'dv = x^3dx', swap: 'u = x^3,\\; dv = \\ln x\\,dx', why: 'Logarithm comes first in LIATE; we can differentiate $\\ln x$ but not easily integrate it.' },
  { int: '\\int \\ln x\\,dx', u: 'u = \\ln x', dv: 'dv = dx', swap: 'u = 1,\\; dv = \\ln x\\,dx', why: 'The trick: write it as $\\ln x \\cdot 1$ and integrate the 1.' },
];

export const genPartsChoice: Gen = () => {
  const s = pick(PARTS_CHOICES);
  return {
    kind: 'mcq',
    prompt: `Integrating ${$(s.int)} by parts. Which split makes life easy?`,
    choices: [
      { text: $(`${s.u},\\; ${s.dv}`), correct: true },
      { text: $(s.swap) },
      { text: "Neither, by parts won't work here" },
    ],
    explain: `LIATE order for picking $u$: **L**og, **I**nverse trig, **A**lgebraic, **T**rig, **E**xponential. ${s.why} $$\\int u\\,dv = uv - \\int v\\,du$$`,
  };
};

const PARTS_RESULTS = [
  { int: '\\int x e^{x}\\,dx', ans: 'xe^{x} - e^{x} + C', wrong: ['xe^{x} + e^{x} + C', '\\frac{x^2}{2}e^{x} + C', 'e^{x} + C'] },
  { int: '\\int x\\cos x\\,dx', ans: 'x\\sin x + \\cos x + C', wrong: ['x\\sin x - \\cos x + C', '\\frac{x^2}{2}\\sin x + C', '-x\\sin x + \\cos x + C'] },
  { int: '\\int \\ln x\\,dx', ans: 'x\\ln x - x + C', wrong: ['\\frac{1}{x} + C', 'x\\ln x + C', '\\frac{(\\ln x)^2}{2} + C'] },
  { int: '\\int x\\sin x\\,dx', ans: '-x\\cos x + \\sin x + C', wrong: ['x\\cos x - \\sin x + C', '-x\\cos x - \\sin x + C', '\\frac{x^2}{2}\\cos x + C'] },
];

export const genPartsResult: Gen = () => {
  const s = pick(PARTS_RESULTS);
  return {
    kind: 'mcq',
    prompt: `${$(`${s.int} = \\;?`)}`,
    choices: [{ text: $(s.ans), correct: true }, ...s.wrong.map((w) => ({ text: $(w) }))],
    explain: `By parts, $\\int u\\,dv = uv - \\int v\\,du$. You can always check by differentiating your answer (product rule!) and making sure you land back on the integrand. $$${s.int} = ${s.ans}$$`,
  };
};

export const genDefSub: Gen = () => {
  const n = randInt(1, 4);
  const ans = (2 ** (n + 1) - 1) / (n + 1);
  return {
    kind: 'num',
    prompt: `Evaluate ${$(`\\displaystyle\\int_0^1 2x\\,(x^2+1)^{${n}}\\,dx`)}`,
    answer: ans,
    tol: 0.02,
    hint: 'Try $u = x^2 + 1$, and remember to change the limits!',
    explain: `Let $u = x^2+1$, $du = 2x\\,dx$. Limits: $x=0 \\Rightarrow u=1$, $x=1 \\Rightarrow u=2$. $$\\int_1^2 u^{${n}}\\,du = \\left[\\frac{u^{${n + 1}}}{${n + 1}}\\right]_1^2 = \\frac{${2 ** (n + 1)} - 1}{${n + 1}} = ${fracTex(2 ** (n + 1) - 1, n + 1)} \\approx ${fmt(ans, 3)}$$`,
  };
};

/* ───────────── Week 12 · Applications ───────────── */

export const genAreaBetween: Gen = () => {
  const k = randInt(1, 4);
  return {
    kind: 'num',
    prompt: `Find the area enclosed between ${$(`y = ${k === 1 ? '' : k}x`)} and ${$('y = x^2')}.`,
    answer: k ** 3 / 6,
    tol: 0.02,
    hint: 'Find where they cross first. Fractions are fine.',
    explain: `They meet where $x^2 = ${k}x$, so $x = 0$ or $x = ${k}$. Between them the line is on top: $$\\int_0^{${k}} (${k}x - x^2)\\,dx = \\left[\\tfrac{${k}}{2}x^2 - \\tfrac13x^3\\right]_0^{${k}} = ${fracTex(k ** 3, 2)} - ${fracTex(k ** 3, 3)} = ${fracTex(k ** 3, 6)}$$`,
  };
};

export const genAverage: Gen = () => {
  const b = randInt(1, 6);
  return {
    kind: 'num',
    prompt: `What is the average value of ${$('f(x) = x^2')} on ${$(`[0, ${b}]`)}?`,
    answer: (b * b) / 3,
    tol: 0.02,
    explain: `Average value = total area ÷ width: $$\\bar f = \\frac{1}{${b} - 0}\\int_0^{${b}} x^2\\,dx = \\frac{1}{${b}}\\cdot\\frac{${b ** 3}}{3} = ${fracTex(b * b, 3)}$$`,
  };
};

export const genProbability: Gen = () => {
  const a = pick([0.2, 0.3, 0.5, 0.6, 0.8]);
  return {
    kind: 'num',
    prompt: `A random variable has density ${$('p(x) = 2x')} on ${$('[0, 1]')}. Find ${$(`P(X \\le ${a})`)}.`,
    answer: a * a,
    tol: 0.005,
    explain: `Probability = area under the density: $$P(X\\le ${a}) = \\int_0^{${a}} 2x\\,dx = \\big[x^2\\big]_0^{${a}} = ${fmt(a * a, 3)}$$ This is exactly how integration powers probability in Teaching Block 2.`,
  };
};

export const genSignedArea: Gen = () => {
  const n = pick([1, 2]);
  return {
    kind: 'mcq',
    prompt: `${$(`\\int_{-${n}}^{${n}} x^3\\,dx`)} equals 0. Why?`,
    choices: [
      { text: 'Area below the axis counts as negative and cancels the area above', correct: true },
      { text: 'The curve has zero area' },
      { text: 'Because $x^3$ has no antiderivative' },
      { text: 'Integrals over symmetric intervals are always 0' },
    ],
    explain: `$x^3$ is odd: the bit below the axis on $[-${n},0]$ is a mirror image of the bit above on $[0,${n}]$. Integrals measure **signed** area, so they cancel. To get the actual shaded area you'd split at 0 and add absolute values: $2\\times\\frac{${n ** 4}}{4} = ${fmt(n ** 4 / 2)}$.`,
  };
};

export const ALL_GENS = {
  derivatives: [genPowerRule, genPolyDeriv, genSlopeAt, genLineGradient, genSpecialDeriv],
  optimisation: [genStationaryQuad, genSecondDerivTest, genCubicStationary, genGDStep],
  partial: [genChain, genChainExp, genProduct, genPartial, genGradientAt],
  integration: [genIntPower, genDefinite, genIntSpecial, genRiemann],
  techniques: [genSubChoice, genPartsChoice, genPartsResult, genDefSub],
  applications: [genAreaBetween, genAverage, genProbability, genSignedArea],
};
