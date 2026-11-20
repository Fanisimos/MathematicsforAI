import { useEffect, useRef, type ReactNode } from 'react';
import type { View } from '../lib/math';
import { toSvg } from './Plot';

const STOPS: [number, [number, number, number]][] = [
  [0, [11, 18, 48]],
  [0.25, [30, 58, 138]],
  [0.5, [124, 58, 237]],
  [0.75, [236, 72, 153]],
  [1, [253, 230, 138]],
];

export function colormap(t: number): [number, number, number] {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      const k = (t - t0) / (t1 - t0);
      return [0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * k) as [number, number, number];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export type FieldCtx = { X: (x: number) => number; Y: (y: number) => number; size: number };

/** A 2-D scalar field f(x, y) drawn as a heatmap with contour bands, plus an SVG overlay. */
export function Field({
  f,
  view,
  size = 400,
  res = 160,
  bands = 12,
  onScrub,
  onClickPoint,
  children,
  ariaLabel,
}: {
  f: (x: number, y: number) => number;
  view: View;
  size?: number;
  res?: number;
  bands?: number;
  onScrub?: (x: number, y: number) => void;
  onClickPoint?: (x: number, y: number) => void;
  children?: (c: FieldCtx) => ReactNode;
  ariaLabel?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pressed = useRef(false);
  const { xMin, xMax, yMin, yMax } = view;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const vals = new Float64Array(res * res);
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < res; j++)
      for (let i = 0; i < res; i++) {
        const x = xMin + ((i + 0.5) / res) * (xMax - xMin);
        const y = yMax - ((j + 0.5) / res) * (yMax - yMin);
        const v = f(x, y);
        vals[j * res + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    const img = ctx.createImageData(res, res);
    for (let k = 0; k < vals.length; k++) {
      const t = (vals[k] - lo) / (hi - lo || 1);
      let [r, g, b] = colormap(t);
      const band = (t * bands) % 1;
      if (band < 0.07) [r, g, b] = [r * 0.55, g * 0.55, b * 0.55];
      img.data[k * 4] = r;
      img.data[k * 4 + 1] = g;
      img.data[k * 4 + 2] = b;
      img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [f, res, bands, xMin, xMax, yMin, yMax]);

  const X = (x: number) => ((x - xMin) / (xMax - xMin)) * size;
  const Y = (y: number) => size - ((y - yMin) / (yMax - yMin)) * size;
  const toData = (cx: number, cy: number) => {
    const p = toSvg(svg.current!, cx, cy);
    return [
      Math.min(xMax, Math.max(xMin, xMin + (p.x / size) * (xMax - xMin))),
      Math.min(yMax, Math.max(yMin, yMin + ((size - p.y) / size) * (yMax - yMin))),
    ] as const;
  };

  return (
    <div className="field" role="img" aria-label={ariaLabel}>
      <canvas ref={canvas} width={res} height={res} />
      <svg
        ref={svg}
        viewBox={`0 0 ${size} ${size}`}
        className={onScrub ? 'scrubbable' : onClickPoint ? 'clickable' : ''}
        onPointerDown={(e) => {
          if (!onScrub) return;
          pressed.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onScrub(...toData(e.clientX, e.clientY));
        }}
        onPointerMove={(e) => onScrub && pressed.current && onScrub(...toData(e.clientX, e.clientY))}
        onPointerUp={(e) => {
          pressed.current = false;
          onClickPoint?.(...toData(e.clientX, e.clientY));
        }}
        onPointerCancel={() => (pressed.current = false)}
      >
        {children?.({ X, Y, size })}
      </svg>
    </div>
  );
}

export function FieldArrow({ x1, y1, x2, y2, color, width = 3 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3) return null;
  const head = Math.min(14, len * 0.5);
  const p = (a: number) => `${x2 - head * Math.cos(ang + a)},${y2 - head * Math.sin(ang + a)}`;
  return (
    <g style={{ stroke: color, fill: color }}>
      <line x1={x1} y1={y1} x2={x2 - (head / 2) * Math.cos(ang)} y2={y2 - (head / 2) * Math.sin(ang)} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${p(0.45)} ${p(-0.45)}`} />
    </g>
  );
}
