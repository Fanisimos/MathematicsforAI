import type { Gen } from '../components/Quiz';
import { fmt, pick, polyTex, randInt, randNonZero } from '../lib/math';
import { CodeView } from './MatlabCode';
import { ML_GENS2 } from './matlabGens2';

const vec = (v: number[]) => `\`[${v.map((n) => fmt(n, 4)).join(' ')}]\``;

export const mlPolyder: Gen = () => {
  const a = randNonZero(-4, 5), b = randInt(-5, 5), c = randInt(-6, 6), d = randInt(-9, 9);
  return {
    kind: 'mcq',
    prompt: `In MATLAB a polynomial is stored as its coefficients, highest power first. What does \`polyder([${a} ${b} ${c} ${d}])\` return?`,
    choices: [
      { text: vec([3 * a, 2 * b, c]), correct: true },
      { text: vec([a, b, c]) },
      { text: vec([3 * a, 2 * b, c, d]) },
      { text: vec([3 * a, 2 * b, c, 0]) },
    ],
    explain: `\`[${a} ${b} ${c} ${d}]\` means $${a}x^3 + ${b}x^2 + ${c}x + ${d}$. Its derivative is $${3 * a}x^2 + ${2 * b}x + ${c}$, so \`polyder\` returns ${vec([3 * a, 2 * b, c])}. The constant disappears and the vector gets one shorter.`,
  };
};

export const mlPolyint: Gen = () => {
  const k = randNonZero(-3, 4), m = randNonZero(-4, 4), c = randInt(-6, 6);
  return {
    kind: 'mcq',
    prompt: `What does \`polyint([${3 * k} ${2 * m} ${c}])\` return?`,
    choices: [
      { text: vec([k, m, c, 0]), correct: true },
      { text: vec([k, m, c]) },
      { text: vec([6 * k, 2 * m]) },
      { text: vec([3 * k, 2 * m, c, 0]) },
    ],
    explain: `\`[${3 * k} ${2 * m} ${c}]\` is $${3 * k}x^2 + ${2 * m}x + ${c}$. Integrating gives $${k}x^3 + ${m}x^2 + ${c}x + C$. \`polyint\` uses $C = 0$, so the answer ends in a 0: ${vec([k, m, c, 0])}.`,
  };
};

export const mlPolyval: Gen = () => {
  const b = randInt(-5, 5), c = randInt(-6, 6), k = randInt(-3, 4);
  return {
    kind: 'num',
    prompt: `What does \`polyval([1 ${b} ${c}], ${k})\` return?`,
    answer: k * k + b * k + c,
    explain: `\`polyval(p, x)\` evaluates the polynomial at $x$: $(${k})^2 + ${b}(${k}) + ${c} = ${k * k + b * k + c}$.`,
  };
};

export const mlElementwise: Gen = () => {
  const op = pick(['^2', '*x'] as const);
  const dot = op === '^2' ? '.^2' : '.*x';
  return {
    kind: 'mcq',
    prompt: `This code gives an error. What's the fix?`,
    visual: <CodeView code={`x = 0:0.5:2;\ny = x${op}      % error!`} />,
    choices: [
      { text: `Use \`y = x${dot}\` (element-wise operator)`, correct: true },
      { text: 'Declare `syms x` first' },
      { text: 'Use `linspace` instead of `0:0.5:2`' },
      { text: 'Add a semicolon to the first line' },
    ],
    explain: `\`x\` is a vector. Without the dot, MATLAB tries **matrix** maths (\`^\`, \`*\`), which fails for two row vectors. The dotted versions \`.^\`, \`.*\`, \`./\` work on each element separately. Always write functions as e.g. \`f = @(x) x.^2\`.`,
  };
};

export const mlDiffVec: Gen = () => {
  const s = randInt(1, 4);
  const v = [s, s + 1, s + 2, s + 3, s + 4].map((n) => n * n);
  return {
    kind: 'mcq',
    prompt: `On a **numeric** vector, \`diff\` behaves differently from \`diff\` on a symbolic function. What does \`diff([${v.join(' ')}])\` return?`,
    choices: [
      { text: vec(v.slice(1).map((n, i) => n - v[i])), correct: true },
      { text: vec(v.map((n) => 2 * Math.sqrt(n))) },
      { text: vec(v.slice(1).map((n, i) => n + v[i])) },
      { text: `\`0\`` },
    ],
    explain: `On numbers, \`diff\` returns differences of neighbours: $v_2 - v_1, v_3 - v_2, \\dots$ (one element shorter). Divide by the step size and you get a numerical derivative: \`diff(y)./diff(x)\`.`,
  };
};

export const mlSymDiff: Gen = () => {
  const n = randInt(3, 7), a = randInt(2, 6);
  const kind = pick(['pow', 'chain'] as const);
  if (kind === 'pow')
    return {
      kind: 'mcq',
      prompt: `After \`syms x\`, what does \`diff(${a}*x^${n}, x)\` display?`,
      choices: [
        { text: `\`${a * n}*x^${n - 1}\``, correct: true },
        { text: `\`${a}*x^${n - 1}\`` },
        { text: `\`${a * n}*x^${n}\`` },
        { text: `\`${a}*x^${n + 1}/${n + 1}\`` },
      ],
      explain: `Power rule: $\\frac{d}{dx}${a}x^{${n}} = ${a * n}x^{${n - 1}}$. MATLAB writes powers with \`^\` and multiplication with \`*\`.`,
    };
  return {
    kind: 'mcq',
    prompt: `After \`syms x\`, what does \`diff(sin(${a}*x), x)\` display?`,
    choices: [
      { text: `\`${a}*cos(${a}*x)\``, correct: true },
      { text: `\`cos(${a}*x)\`` },
      { text: `\`-${a}*cos(${a}*x)\`` },
      { text: `\`${a}*sin(${a}*x)\`` },
    ],
    explain: `Chain rule: outer $\\sin u \\to \\cos u$, inner $${a}x \\to ${a}$. MATLAB applies it automatically.`,
  };
};

export const mlSymInt: Gen = () => {
  const n = randInt(2, 6);
  return {
    kind: 'mcq',
    prompt: `After \`syms x\`, what does \`int(x^${n}, x)\` display?`,
    choices: [
      { text: `\`x^${n + 1}/${n + 1}\``, correct: true },
      { text: `\`x^${n + 1}/${n + 1} + C\`` },
      { text: `\`${n}*x^${n - 1}\`` },
      { text: `\`x^${n + 1}\`` },
    ],
    explain: `Reverse power rule gives $\\frac{x^{${n + 1}}}{${n + 1}}$. MATLAB **never** adds the $+C$: that's your job when writing it up.`,
  };
};

export const mlIntegral: Gen = () => {
  const k = randInt(1, 4), b = randInt(1, 4);
  return {
    kind: 'num',
    prompt: `What does \`integral(@(x) ${2 * k}*x, 0, ${b})\` return?`,
    answer: k * b * b,
    explain: `$\\int_0^{${b}} ${2 * k}x\\,dx = \\big[${k}x^2\\big]_0^{${b}} = ${k * b * b}$. \`integral\` computes this numerically.`,
  };
};

export const mlTrapz: Gen = () => {
  const k = randInt(1, 4);
  return {
    kind: 'num',
    prompt: `What does this return?`,
    visual: <CodeView code={`x = [0 1 2];\ny = ${k}*x.^2;     % y = [0 ${k} ${4 * k}]\ntrapz(x, y)`} />,
    answer: 3 * k,
    explain: `Two trapezia of width 1: $\\frac{0 + ${k}}{2} + \\frac{${k} + ${4 * k}}{2} = ${fmt(k / 2)} + ${fmt((5 * k) / 2)} = ${3 * k}$. (The exact integral is $\\frac{${8 * k}}{3} \\approx ${fmt((8 * k) / 3)}$.)`,
  };
};

export const mlGDLoop: Gen = () => {
  const x0 = pick([4, 8, -4, 6]), a = pick([0.25, 0.1, 0.75]);
  const x1 = x0 * (1 - 2 * a);
  const x2 = x1 * (1 - 2 * a);
  return {
    kind: 'num',
    prompt: `Gradient descent on $f(x) = x^2$. What is \`x\` after this loop?`,
    visual: <CodeView code={`df = @(x) 2*x;\nx = ${x0};\nfor k = 1:2\n    x = x - ${a}*df(x);\nend`} />,
    answer: x2,
    explain: `Step 1: $x = ${x0} - ${a}\\times ${2 * x0} = ${fmt(x1, 4)}$. Step 2: $x = ${fmt(x1, 4)} - ${a}\\times ${fmt(2 * x1, 4)} = ${fmt(x2, 4)}$.`,
  };
};

export const mlRoots: Gen = () => {
  const p = randInt(1, 4), q = randInt(-4, -1);
  return {
    kind: 'mcq',
    prompt: `The derivative of some function is $f'(x) = ${polyTex([[1, 2], [-(p + q), 1], [p * q, 0]])}$. Which command finds its stationary points?`,
    choices: [
      { text: `\`roots([1 ${-(p + q)} ${p * q}])\``, correct: true },
      { text: `\`polyval([1 ${-(p + q)} ${p * q}], 0)\`` },
      { text: `\`polyder([1 ${-(p + q)} ${p * q}])\`` },
      { text: `\`polyint([1 ${-(p + q)} ${p * q}])\`` },
    ],
    explain: `Stationary points solve $f'(x) = 0$, i.e. the **roots** of the polynomial. \`roots\` returns $x = ${p}$ and $x = ${q}$.`,
  };
};

export const mlPartialSubs: Gen = () => {
  const a = randInt(1, 4), p = randInt(-2, 3), q = randInt(-2, 3);
  return {
    kind: 'num',
    prompt: 'What number does this display?',
    visual: <CodeView code={`syms x y\nf = ${a}*x^2*y;\nsubs(diff(f, x), [x y], [${p} ${q}])`} />,
    answer: 2 * a * p * q,
    explain: `$\\frac{\\partial f}{\\partial x} = ${2 * a}xy$ (treat $y$ as constant). At $(${p}, ${q})$: $${2 * a}\\times${p}\\times${q} = ${2 * a * p * q}$.`,
  };
};

const ML_CALC: Record<string, Gen[]> = {
  derivatives: [mlPolyder, mlSymDiff, mlDiffVec, mlElementwise],
  optimisation: [mlGDLoop, mlRoots, mlPolyder, mlPolyval],
  partial: [mlPartialSubs, mlSymDiff, mlElementwise],
  integration: [mlPolyint, mlSymInt, mlIntegral, mlTrapz],
  techniques: [mlSymInt, mlIntegral, mlElementwise],
  applications: [mlIntegral, mlTrapz, mlPolyval, mlRoots],
};

// Topics with only one or two MATLAB-specific generators also get the general ones mixed in.
export const ML_GENS: Record<string, Gen[]> = {
  ...ML_CALC,
  sets: [...ML_GENS2.sets, mlElementwise],
  functions: [...ML_GENS2.functions, mlElementwise, mlPolyval],
  polynomials: [...ML_GENS2.polynomials, mlRoots, mlPolyval, mlPolyder],
  explog: [...ML_GENS2.explog, mlElementwise],
  vectors: ML_GENS2.vectors,
  linsys: ML_GENS2.linsys.concat(mlElementwise),
  lu: ML_GENS2.lu,
  iterative: [...ML_GENS2.iterative, mlGDLoop],
  newton: [...ML_GENS2.newton, mlRoots],
  numint: [...ML_GENS2.numint, mlIntegral, mlTrapz],
};
