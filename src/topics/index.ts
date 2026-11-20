import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

export type Group = 'foundations' | 'calculus' | 'numerical';

export type TopicMeta = {
  id: string;
  week: number;
  weekLabel?: string;
  group: Group;
  emoji: string;
  title: string;
  tagline: string;
  why: string;
  sections: { id: string; label: string }[];
  challenges: string[];
  Component: LazyExoticComponent<ComponentType>;
};

export const GROUPS: { id: Group; title: string; sub: string }[] = [
  { id: 'foundations', title: 'Foundations', sub: 'Weeks 1–5 · sets, functions, algebra, vectors & matrices, linear systems' },
  { id: 'calculus', title: 'Calculus', sub: 'Weeks 7–12 · differentiation, optimisation, integration' },
  { id: 'numerical', title: 'Numerical methods', sub: 'Weeks 7–11 workshops · iterative methods, Newton, numerical integration' },
];

const M = { id: 'matlab', label: '💻 MATLAB' };
const D = { id: 'practice', label: 'Drills' };

/** Ordered by week; within a week the lecture topic comes first. */
export const TOPICS: TopicMeta[] = [
  {
    id: 'sets',
    week: 1,
    group: 'foundations',
    emoji: '🔣',
    title: 'Sets, Logic & Number Systems',
    tagline: 'The language every other topic is written in.',
    why: 'Datasets are sets, classes are subsets, and every database query or decision rule is set logic. Number systems explain why computers struggle with numbers like 0.1.',
    sections: [{ id: 'venn', label: 'Venn' }, { id: 'shade', label: 'Shade It' }, { id: 'numbers', label: 'Number systems' }, { id: 'logic', label: 'Logic' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w1-quiz', 'w1-venn', 'w1-numbers'],
    Component: lazy(() => import('./Sets')),
  },
  {
    id: 'functions',
    week: 2,
    group: 'foundations',
    emoji: '🗺️',
    title: 'Mapping & Functions',
    tagline: 'Inputs in, outputs out: the idea behind every model.',
    why: 'A neural network IS a function, built by composing simple functions layer after layer. Knowing domains, compositions and inverses tells you what a model can and cannot do.',
    sections: [{ id: 'mapping', label: 'Mappings' }, { id: 'compose', label: 'Composition' }, { id: 'inverse', label: 'Inverses' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w2-func-quiz'],
    Component: lazy(() => import('./Functions')),
  },
  {
    id: 'polynomials',
    week: 2,
    group: 'foundations',
    emoji: '🪝',
    title: 'Quadratics & Polynomials',
    tagline: 'Roots, factors, and fitting curves to data.',
    why: 'Polynomial regression is one of the simplest learning models, and it is where you first meet overfitting, the central problem of machine learning.',
    sections: [{ id: 'quadratic', label: 'Quadratics' }, { id: 'roots', label: 'Roots ↔ factors' }, { id: 'fit', label: 'Curve fitting' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w2-poly-quiz'],
    Component: lazy(() => import('./Polynomials')),
  },
  {
    id: 'explog',
    week: 3,
    group: 'foundations',
    emoji: '📈',
    title: 'Exponentials & Logarithms',
    tagline: 'Growth, decay, and turning multiplication into addition.',
    why: 'Softmax, sigmoid, cross-entropy loss and log-likelihood: exp and log are in the output layer of nearly every classifier.',
    sections: [{ id: 'exp', label: 'Exponentials' }, { id: 'log', label: 'Logs' }, { id: 'laws', label: 'Log laws' }, { id: 'softmax', label: 'Softmax' }, M, D],
    challenges: ['w3-explog-quiz'],
    Component: lazy(() => import('./ExpLog')),
  },
  {
    id: 'vectors',
    week: 3,
    group: 'foundations',
    emoji: '🧭',
    title: 'Vectors, Matrices & Norms',
    tagline: 'The data structures of AI, and how to measure them.',
    why: 'Every input to a model is a vector, every layer is a matrix multiplication, and every loss or regulariser is a norm.',
    sections: [{ id: 'vectors', label: 'Vectors' }, { id: 'norms', label: 'Norms' }, { id: 'matrix', label: 'Transformations' }, { id: 'matmul', label: 'Multiplication' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w3-vec-quiz'],
    Component: lazy(() => import('./Vectors')),
  },
  {
    id: 'linsys',
    week: 4,
    group: 'foundations',
    emoji: '🧩',
    title: 'Linear Systems & Gaussian Elimination',
    tagline: 'Solving Ax = b, by picture and by algorithm.',
    why: 'Linear regression, least squares and countless simulations boil down to solving Ax = b, often with millions of unknowns.',
    sections: [{ id: 'lines', label: 'Geometry' }, { id: 'gauss', label: 'Elimination' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w4-quiz', 'w4-elim'],
    Component: lazy(() => import('./LinSys')),
  },
  {
    id: 'lu',
    week: 5,
    group: 'foundations',
    emoji: '🏗️',
    title: 'LU Decomposition & Error',
    tagline: 'Factorise once, solve fast, and know how much to trust the answer.',
    why: 'Training runs in finite precision. Conditioning and error analysis explain why models sometimes produce NaN or unstable results.',
    sections: [{ id: 'lu', label: 'LU' }, { id: 'cost', label: 'Cost' }, { id: 'error', label: 'Floating point' }, { id: 'cond', label: 'Conditioning' }, { id: 'refine', label: 'Refinement' }, M, D],
    challenges: ['w5-quiz'],
    Component: lazy(() => import('./LU')),
  },
  {
    id: 'derivatives',
    week: 7,
    group: 'calculus',
    emoji: '📐',
    title: 'Gradient & Differentiation',
    tagline: 'How steep is a curve at one single point?',
    why: 'Every AI model learns by asking "if I nudge this parameter, does the error go up or down, and how fast?" That question is a derivative.',
    sections: [{ id: 'line', label: 'Gradient' }, { id: 'limit', label: 'Secant → tangent' }, { id: 'tracer', label: "Paint f′" }, { id: 'rules', label: 'Rules' }, { id: 'play', label: 'Slope Sniper' }, M, D],
    challenges: ['w7-quiz', 'w7-sniper'],
    Component: lazy(() => import('./Derivatives')),
  },
  {
    id: 'iterative',
    week: 7,
    group: 'numerical',
    emoji: '🔁',
    title: 'Iterative Methods',
    tagline: 'Jacobi, Gauss–Seidel and fixed-point iteration.',
    why: 'Training a model is itself an iterative method: guess, measure, improve, repeat. Huge sparse systems (like PageRank) are solved this way too.',
    sections: [{ id: 'jacobi', label: 'Jacobi vs G–S' }, { id: 'table', label: 'By hand' }, { id: 'cobweb', label: 'Fixed points' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w7-iter-quiz'],
    Component: lazy(() => import('./Iterative')),
  },
  {
    id: 'optimisation',
    week: 8,
    group: 'calculus',
    emoji: '⛳',
    title: 'Minimum & Maximum',
    tagline: 'Find the bottom of the valley, the core move of machine learning.',
    why: 'Training a neural network means finding the minimum of a loss function. Gradient descent, which you will play below, is how ChatGPT-style models are trained.',
    sections: [{ id: 'explore', label: 'Stationary points' }, { id: 'method', label: 'Recipe' }, { id: 'play', label: 'Descent Golf' }, M, D],
    challenges: ['w8-quiz', 'w8-golf-0', 'w8-golf-1', 'w8-golf-2', 'w8-golf-3'],
    Component: lazy(() => import('./MinMax')),
  },
  {
    id: 'newton',
    week: 8,
    weekLabel: 'Weeks 8–9',
    group: 'numerical',
    emoji: '🎯',
    title: "Newton's Method",
    tagline: 'Single-variable and multivariable root finding.',
    why: 'Second-order optimisers are Newton’s method applied to the gradient. The Jacobian it uses is the same object backpropagation computes.',
    sections: [{ id: 'newton', label: 'Newton 1D' }, { id: 'race', label: 'Race' }, { id: 'multi', label: 'Multivariable' }, { id: 'rules', label: 'Rules' }, M, D],
    challenges: ['w8-newton-quiz'],
    Component: lazy(() => import('./Newton')),
  },
  {
    id: 'partial',
    week: 9,
    group: 'calculus',
    emoji: '🏔️',
    title: 'Chain Rule & Partial Derivatives',
    tagline: 'Functions inside functions, and functions of many variables.',
    why: 'Backpropagation is the chain rule. The gradient vector of partial derivatives tells a model which way to move all its millions of weights at once.',
    sections: [{ id: 'chain', label: 'Chain rule' }, { id: 'rules', label: 'Rules' }, { id: 'partial', label: 'Partials' }, { id: 'play', label: 'Summit in the Fog' }, M, D],
    challenges: ['w9-quiz', 'w9-fog'],
    Component: lazy(() => import('./Partial')),
  },
  {
    id: 'integration',
    week: 10,
    group: 'calculus',
    emoji: '🧱',
    title: 'Introduction to Integration',
    tagline: 'Adding up infinitely many infinitely thin rectangles.',
    why: 'Probabilities, expected values and the areas under ROC curves used to judge classifiers are all integrals.',
    sections: [{ id: 'riemann', label: 'Riemann sums' }, { id: 'ftc', label: 'Fundamental theorem' }, { id: 'rules', label: 'Rules' }, { id: 'play', label: 'Area Guess' }, M, D],
    challenges: ['w10-quiz', 'w10-area'],
    Component: lazy(() => import('./Integration')),
  },
  {
    id: 'numint',
    week: 10,
    weekLabel: 'Weeks 10–11',
    group: 'numerical',
    emoji: '🎲',
    title: 'Numerical Integration',
    tagline: 'Trapezium, Simpson, error orders and Monte Carlo.',
    why: 'Most integrals in probability (like the bell curve) have no formula. Numerical and Monte Carlo integration are how AI computes expectations.',
    sections: [{ id: 'rules-compare', label: 'Rules compared' }, { id: 'convergence', label: 'Convergence' }, { id: 'montecarlo', label: 'Monte Carlo' }, { id: 'rules', label: 'Formulas' }, M, D],
    challenges: ['w10-numint-quiz'],
    Component: lazy(() => import('./NumInt')),
  },
  {
    id: 'techniques',
    week: 11,
    group: 'calculus',
    emoji: '🪆',
    title: 'Further Integration',
    tagline: 'Substitution and integration by parts, step by step.',
    why: 'Most integrals in probability (Teaching Block 2) need one of these two tricks. Recognising which one is the whole game.',
    sections: [{ id: 'sub', label: 'Substitution' }, { id: 'parts', label: 'By parts' }, { id: 'which', label: 'Strategy' }, M, D],
    challenges: ['w11-quiz'],
    Component: lazy(() => import('./Techniques')),
  },
  {
    id: 'applications',
    week: 12,
    group: 'calculus',
    emoji: '🏁',
    title: 'Applications of Integration',
    tagline: 'Areas between curves, averages, probability, and the final boss.',
    why: 'Continuous probability is just area under a curve. This is the bridge from calculus into the statistics half of the module.',
    sections: [{ id: 'between', label: 'Between curves' }, { id: 'average', label: 'Average value' }, { id: 'prob', label: 'Probability' }, M, D, { id: 'boss', label: '👾 Boss' }],
    challenges: ['w12-quiz', 'boss'],
    Component: lazy(() => import('./Applications')),
  },
];

export const topicPct = (t: TopicMeta, best: Record<string, number>) =>
  t.challenges.reduce((s, id) => s + (best[id] ?? 0), 0) / t.challenges.length;
