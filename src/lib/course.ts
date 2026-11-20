/** Teaching Block 1 timetable (2026/27). topicId links to an interactive module when one exists. */
export type Session = { title: string; kind: 'session' | 'assessment'; topicId?: string };
export type Week = { week: number; sessions: Session[]; note?: string };

export const TB1: Week[] = [
  { week: 1, sessions: [{ title: 'Fundamental Mathematics', kind: 'session' }, { title: 'Introduction to MATLAB', kind: 'session' }] },
  { week: 2, sessions: [{ title: 'Mapping and Functions', kind: 'session' }, { title: 'Quadratic equations & polynomials', kind: 'session' }] },
  { week: 3, sessions: [{ title: 'Exponential & logarithmic functions', kind: 'session' }, { title: 'Vectors, Matrices & Norms', kind: 'session' }] },
  { week: 4, sessions: [{ title: 'Linear Systems', kind: 'session' }, { title: 'Gaussian Elimination', kind: 'session' }] },
  { week: 5, sessions: [{ title: 'LU decomposition', kind: 'session' }, { title: 'Error estimates & iterative refinement', kind: 'session' }] },
  { week: 6, sessions: [{ title: 'Coursework Portfolio TB1.1 (12.5%)', kind: 'assessment' }], note: 'Enrichment & Assessment Week' },
  { week: 7, sessions: [{ title: 'Gradient & intro to differentiation', kind: 'session', topicId: 'derivatives' }, { title: 'Iterative methods', kind: 'session' }] },
  { week: 8, sessions: [{ title: 'Minimum & Maximum of a function', kind: 'session', topicId: 'optimisation' }, { title: 'Newton Method', kind: 'session' }] },
  { week: 9, sessions: [{ title: 'Further & Partial Differentiation', kind: 'session', topicId: 'partial' }, { title: 'Multivariable Newton Method', kind: 'session' }] },
  { week: 10, sessions: [{ title: 'Integration', kind: 'session', topicId: 'integration' }, { title: 'Numerical Integration', kind: 'session' }] },
  { week: 11, sessions: [{ title: 'Further integration', kind: 'session', topicId: 'techniques' }, { title: 'Numerical Integration (cont.)', kind: 'session' }] },
  { week: 12, sessions: [{ title: 'Application of integration', kind: 'session', topicId: 'applications' }, { title: 'In-Class Test TB1 (25%)', kind: 'assessment' }] },
];

export const WEEK1_START = new Date(2026, 8, 28); // Mon 28 Sep 2026

export const DEADLINES = [
  { label: 'In-Class Test TB1', sub: '25% · Thu 17 Dec', date: new Date(2026, 11, 17, 9) },
  { label: 'Portfolio TB1.2 due', sub: '12.5% · Fri 8 Jan', date: new Date(2027, 0, 8, 23, 59) },
];

export function currentWeek(now = new Date()) {
  const w = Math.floor((now.getTime() - WEEK1_START.getTime()) / (7 * 864e5)) + 1;
  return w >= 1 && w <= 12 ? w : null;
}

export function daysUntil(d: Date, now = new Date()) {
  return Math.ceil((d.getTime() - now.getTime()) / 864e5);
}
