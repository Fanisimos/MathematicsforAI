import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

export type TopicMeta = {
  id: string;
  week: number;
  emoji: string;
  title: string;
  tagline: string;
  why: string;
  sections: { id: string; label: string }[];
  challenges: string[];
  Component: LazyExoticComponent<ComponentType>;
};

export const TOPICS: TopicMeta[] = [
  {
    id: 'derivatives',
    week: 7,
    emoji: '📈',
    title: 'Gradient & Differentiation',
    tagline: 'How steep is a curve at one single point?',
    why: 'Every AI model learns by asking "if I nudge this parameter, does the error go up or down, and how fast?" That question is a derivative.',
    sections: [
      { id: 'line', label: 'Gradient' },
      { id: 'limit', label: 'Secant → tangent' },
      { id: 'tracer', label: "Paint f′" },
      { id: 'rules', label: 'Rules' },
      { id: 'play', label: 'Slope Sniper' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
    ],
    challenges: ['w7-quiz', 'w7-sniper'],
    Component: lazy(() => import('./Derivatives')),
  },
  {
    id: 'optimisation',
    week: 8,
    emoji: '⛳',
    title: 'Minimum & Maximum',
    tagline: 'Find the bottom of the valley, the core move of machine learning.',
    why: 'Training a neural network means finding the minimum of a loss function. Gradient descent, which you will play below, is how ChatGPT-style models are trained.',
    sections: [
      { id: 'explore', label: 'Stationary points' },
      { id: 'method', label: 'Recipe' },
      { id: 'play', label: 'Descent Golf' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
    ],
    challenges: ['w8-quiz', 'w8-golf-0', 'w8-golf-1', 'w8-golf-2', 'w8-golf-3'],
    Component: lazy(() => import('./MinMax')),
  },
  {
    id: 'partial',
    week: 9,
    emoji: '🏔️',
    title: 'Chain Rule & Partial Derivatives',
    tagline: 'Functions inside functions, and functions of many variables.',
    why: 'Backpropagation is the chain rule. The gradient vector of partial derivatives tells a model which way to move all its millions of weights at once.',
    sections: [
      { id: 'chain', label: 'Chain rule' },
      { id: 'rules', label: 'Rules' },
      { id: 'partial', label: 'Partials' },
      { id: 'play', label: 'Summit in the Fog' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
    ],
    challenges: ['w9-quiz', 'w9-fog'],
    Component: lazy(() => import('./Partial')),
  },
  {
    id: 'integration',
    week: 10,
    emoji: '🧱',
    title: 'Introduction to Integration',
    tagline: 'Adding up infinitely many infinitely thin rectangles.',
    why: 'Probabilities, expected values and the areas under ROC curves used to judge classifiers are all integrals.',
    sections: [
      { id: 'riemann', label: 'Riemann sums' },
      { id: 'ftc', label: 'Fundamental theorem' },
      { id: 'rules', label: 'Rules' },
      { id: 'play', label: 'Area Guess' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
    ],
    challenges: ['w10-quiz', 'w10-area'],
    Component: lazy(() => import('./Integration')),
  },
  {
    id: 'techniques',
    week: 11,
    emoji: '🪆',
    title: 'Further Integration',
    tagline: 'Substitution and integration by parts, step by step.',
    why: 'Most integrals in probability (Teaching Block 2) need one of these two tricks. Recognising which one is the whole game.',
    sections: [
      { id: 'sub', label: 'Substitution' },
      { id: 'parts', label: 'By parts' },
      { id: 'which', label: 'Strategy' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
    ],
    challenges: ['w11-quiz'],
    Component: lazy(() => import('./Techniques')),
  },
  {
    id: 'applications',
    week: 12,
    emoji: '🎯',
    title: 'Applications of Integration',
    tagline: 'Areas between curves, averages, and probability.',
    why: 'Continuous probability is just area under a curve. This is the bridge from calculus into the statistics half of the module.',
    sections: [
      { id: 'between', label: 'Between curves' },
      { id: 'average', label: 'Average value' },
      { id: 'prob', label: 'Probability' },
      { id: 'matlab', label: '💻 MATLAB' },
      { id: 'practice', label: 'Drills' },
      { id: 'boss', label: '👾 Boss' },
    ],
    challenges: ['w12-quiz', 'boss'],
    Component: lazy(() => import('./Applications')),
  },
];

export const topicPct = (t: TopicMeta, best: Record<string, number>) =>
  t.challenges.reduce((s, id) => s + (best[id] ?? 0), 0) / t.challenges.length;
