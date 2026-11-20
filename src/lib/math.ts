export type Fn = (x: number) => number;
export type View = { xMin: number; xMax: number; yMin: number; yMax: number };

/** Central-difference derivative. */
export const deriv = (f: Fn, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
export const deriv2 = (f: Fn, x: number, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);

/** Composite Simpson's rule (n is forced even). */
export function simpson(f: Fn, a: number, b: number, n = 800) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export type RiemannMethod = 'left' | 'right' | 'mid' | 'trap';

export function riemann(f: Fn, a: number, b: number, n: number, method: RiemannMethod) {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h;
    if (method === 'left') s += f(x0);
    else if (method === 'right') s += f(x0 + h);
    else if (method === 'mid') s += f(x0 + h / 2);
    else s += (f(x0) + f(x0 + h)) / 2;
  }
  return s * h;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const randNonZero = (a: number, b: number) => {
  let v = 0;
  while (v === 0) v = randInt(a, b);
  return v;
};
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pretty number: trims trailing zeros, avoids "-0". */
export function fmt(x: number, d = 2) {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  const r = Number(x.toFixed(d));
  return (Object.is(r, -0) ? 0 : r).toString();
}

/** Signed number for building expressions: " + 3" / " - 3". */
export const signed = (x: number) => (x < 0 ? ` - ${fmt(-x)}` : ` + ${fmt(x)}`);

/** Parse a typed answer: decimals, fractions (3/4), mixed signs, "pi". */
export function parseNum(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/−/g, '-').replace(/π/g, 'pi');
  if (!s) return null;
  const num = (t: string): number | null => {
    if (t === 'pi') return Math.PI;
    if (t === '-pi') return -Math.PI;
    const m = t.match(/^([-+]?\d*\.?\d+)(pi)?$/);
    if (!m) return null;
    return parseFloat(m[1]) * (m[2] ? Math.PI : 1);
  };
  if (s.includes('/')) {
    const [p, q] = s.split('/');
    const a = num(p), b = num(q);
    if (a === null || b === null || b === 0) return null;
    return a / b;
  }
  return num(s);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** LaTeX for the fraction p/q in lowest terms. */
export function fracTex(p: number, q: number) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q);
  p /= g; q /= g;
  if (q === 1) return `${p}`;
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
}

/** One polynomial term c·x^n as LaTeX (no leading sign handling). */
export function termTex(c: number, n: number, v = 'x', coefTex?: string) {
  const abs = Math.abs(c);
  const coef = coefTex ?? (abs === 1 && n !== 0 ? '' : fmt(abs));
  if (n === 0) return coefTex ?? fmt(abs);
  if (n === 1) return `${coef}${v}`;
  return `${coef}${v}^{${n}}`;
}

/** Polynomial from [coef, power] pairs, highest power first. */
export function polyTex(terms: [number, number][], v = 'x') {
  const nz = terms.filter(([c]) => c !== 0);
  if (!nz.length) return '0';
  return nz
    .map(([c, n], i) => {
      const t = termTex(c, n, v);
      if (i === 0) return (c < 0 ? '-' : '') + t;
      return (c < 0 ? ' - ' : ' + ') + t;
    })
    .join('');
}

/** Solve ax² + bx + c = 0 (real roots, ascending). */
export function quadRoots(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
  const d = b * b - 4 * a * c;
  if (d < -1e-12) return [];
  if (Math.abs(d) <= 1e-12) return [-b / (2 * a)];
  const s = Math.sqrt(d);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((p, q) => p - q);
}

/** Animate a value over `ms` with requestAnimationFrame. Returns a cancel function. */
export function tween(ms: number, onFrame: (t: number) => void, onDone?: () => void) {
  let raf = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    onFrame(t);
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
