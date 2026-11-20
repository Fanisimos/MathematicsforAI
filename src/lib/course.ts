/** Teaching Block 1 timetable (2026/27). Every session links to the page that covers it. */
export type Session = { title: string; kind: 'session' | 'assessment'; href?: string };
export type Week = { week: number; sessions: Session[]; note?: string };

const t = (id: string, focus?: string) => `#/topic/${id}${focus ? `?${focus}` : ''}`;

export const TB1: Week[] = [
  { week: 1, sessions: [{ title: 'Fundamental Mathematics', kind: 'session', href: t('sets') }, { title: 'Introduction to MATLAB', kind: 'session', href: '#/matlab' }] },
  { week: 2, sessions: [{ title: 'Mapping and Functions', kind: 'session', href: t('functions') }, { title: 'Quadratic equations & polynomials', kind: 'session', href: t('polynomials') }] },
  { week: 3, sessions: [{ title: 'Exponential & logarithmic functions', kind: 'session', href: t('explog') }, { title: 'Vectors, Matrices & Norms', kind: 'session', href: t('vectors') }] },
  { week: 4, sessions: [{ title: 'Linear Systems', kind: 'session', href: t('linsys') }, { title: 'Gaussian Elimination', kind: 'session', href: t('linsys', 'gauss') }] },
  { week: 5, sessions: [{ title: 'LU decomposition', kind: 'session', href: t('lu') }, { title: 'Error estimates & iterative refinement', kind: 'session', href: t('lu', 'error') }] },
  { week: 6, sessions: [{ title: 'Coursework Portfolio TB1.1 (12.5%): covers weeks 1–5', kind: 'assessment' }], note: 'Enrichment & Assessment Week' },
  { week: 7, sessions: [{ title: 'Gradient & intro to differentiation', kind: 'session', href: t('derivatives') }, { title: 'Iterative methods', kind: 'session', href: t('iterative') }] },
  { week: 8, sessions: [{ title: 'Minimum & Maximum of a function', kind: 'session', href: t('optimisation') }, { title: 'Newton Method', kind: 'session', href: t('newton') }] },
  { week: 9, sessions: [{ title: 'Further & Partial Differentiation', kind: 'session', href: t('partial') }, { title: 'Multivariable Newton Method', kind: 'session', href: t('newton', 'multi') }] },
  { week: 10, sessions: [{ title: 'Integration', kind: 'session', href: t('integration') }, { title: 'Numerical Integration', kind: 'session', href: t('numint') }] },
  { week: 11, sessions: [{ title: 'Further integration', kind: 'session', href: t('techniques') }, { title: 'Numerical Integration (cont.)', kind: 'session', href: t('numint', 'convergence') }] },
  { week: 12, sessions: [{ title: 'Application of integration', kind: 'session', href: t('applications') }, { title: 'In-Class Test TB1 (25%)', kind: 'assessment', href: t('applications', 'boss') }] },
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
