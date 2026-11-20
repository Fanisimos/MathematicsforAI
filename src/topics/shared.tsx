import type { Fn, View } from '../lib/math';
export type { View };

/** Fit a y-range around f on [xMin, xMax]. */
export function autoView(f: Fn, xMin: number, xMax: number, pad = 0.15, clampY = 30): View {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 200; i++) {
    const y = f(xMin + ((xMax - xMin) * i) / 200);
    if (isFinite(y)) {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  lo = Math.max(lo, -clampY);
  hi = Math.min(hi, clampY);
  const span = Math.max(hi - lo, 1);
  return { xMin, xMax, yMin: Math.min(lo - span * pad, -0.5), yMax: Math.max(hi + span * pad, 0.5) };
}

export type FnDef = { key: string; label: string; f: Fn; df?: Fn; tex?: string; dtex?: string };
