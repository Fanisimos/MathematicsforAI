import {
  createContext,
  useContext,
  useId,
  useRef,
  type PointerEvent as RPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { clamp, fmt, type Fn, type View } from '../lib/math';
export type { View };

export const C = {
  curve: '#22d3ee',
  curve2: '#a78bfa',
  tangent: '#f472b6',
  secant: '#fbbf24',
  good: '#34d399',
  bad: '#f87171',
  area: '#7c5cff',
  text: '#e8eaf6',
  muted: '#9aa0c3',
  grid: '#1f2442',
  axis: '#55608f',
  bg: '#0b0d17',
};

type Ctx = View & {
  W: number;
  H: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  ix: (px: number) => number;
  iy: (py: number) => number;
  svg: RefObject<SVGSVGElement | null>;
  uid: string;
};

const PlotContext = createContext<Ctx | null>(null);
export function usePlot() {
  const c = useContext(PlotContext);
  if (!c) throw new Error('Plot primitives must be rendered inside <Plot>');
  return c;
}

const M = { l: 40, r: 12, t: 12, b: 26 };

export function toSvg(svg: SVGSVGElement, cx: number, cy: number) {
  const pt = svg.createSVGPoint();
  pt.x = cx;
  pt.y = cy;
  const m = svg.getScreenCTM();
  return m ? pt.matrixTransform(m.inverse()) : pt;
}

function niceTicks(lo: number, hi: number, target: number) {
  const raw = (hi - lo) / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? 10 * p;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

export function Plot({
  view,
  width = 640,
  height = 360,
  children,
  onScrub,
  onClickPoint,
  xLabel = 'x',
  yLabel = 'y',
  ticks = true,
  className,
  ariaLabel,
}: {
  view: View;
  width?: number;
  height?: number;
  children?: ReactNode;
  /** Called while the pointer is pressed and moving anywhere on the plot. */
  onScrub?: (x: number, y: number) => void;
  onClickPoint?: (x: number, y: number) => void;
  xLabel?: string;
  yLabel?: string;
  ticks?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pressed = useRef(false);
  const { xMin, xMax, yMin, yMax } = view;
  const pw = width - M.l - M.r;
  const ph = height - M.t - M.b;
  const sx = (x: number) => M.l + ((x - xMin) / (xMax - xMin)) * pw;
  const sy = (y: number) => height - M.b - ((y - yMin) / (yMax - yMin)) * ph;
  const ix = (px: number) => xMin + ((px - M.l) / pw) * (xMax - xMin);
  const iy = (py: number) => yMin + ((height - M.b - py) / ph) * (yMax - yMin);
  const ctx: Ctx = { ...view, W: width, H: height, sx, sy, ix, iy, svg, uid };

  const dataPoint = (e: RPointerEvent) => {
    const p = toSvg(svg.current!, e.clientX, e.clientY);
    return [clamp(ix(p.x), xMin, xMax), clamp(iy(p.y), yMin, yMax)] as const;
  };

  const xt = ticks ? niceTicks(xMin, xMax, width / 70) : [];
  const yt = ticks ? niceTicks(yMin, yMax, height / 50) : [];
  const x0 = clamp(0, xMin, xMax);
  const y0 = clamp(0, yMin, yMax);

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${height}`}
      className={`plot ${onScrub ? 'scrubbable' : ''} ${onClickPoint ? 'clickable' : ''} ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (!onScrub) return;
        pressed.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        onScrub(...dataPoint(e));
      }}
      onPointerMove={(e) => {
        if (onScrub && pressed.current) onScrub(...dataPoint(e));
      }}
      onPointerUp={(e) => {
        pressed.current = false;
        if (onClickPoint) onClickPoint(...dataPoint(e));
      }}
      onPointerCancel={() => (pressed.current = false)}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <rect x={M.l} y={M.t} width={pw} height={ph} />
        </clipPath>
      </defs>
      <rect x={M.l} y={M.t} width={pw} height={ph} className="plot-bg" />
      {xt.map((v) => (
        <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={M.t} y2={M.t + ph} stroke={C.grid} />
      ))}
      {yt.map((v) => (
        <line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={M.l} x2={M.l + pw} stroke={C.grid} />
      ))}
      <line x1={M.l} x2={M.l + pw} y1={sy(y0)} y2={sy(y0)} stroke={C.axis} strokeWidth={1.5} />
      <line y1={M.t} y2={M.t + ph} x1={sx(x0)} x2={sx(x0)} stroke={C.axis} strokeWidth={1.5} />
      {xt.map((v) => (
        <text key={`tx${v}`} x={sx(v)} y={height - 8} className="tick" textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
      {yt.map((v) => (
        <text key={`ty${v}`} x={M.l - 6} y={sy(v) + 4} className="tick" textAnchor="end">
          {fmt(v)}
        </text>
      ))}
      <text x={M.l + pw - 4} y={sy(y0) - 6} className="axis-label" textAnchor="end">
        {xLabel}
      </text>
      <text x={sx(x0) + 6} y={M.t + 14} className="axis-label">
        {yLabel}
      </text>
      <PlotContext.Provider value={ctx}>
        <g clipPath={`url(#clip-${uid})`}>{children}</g>
      </PlotContext.Provider>
    </svg>
  );
}

export function Curve({
  f,
  color = C.curve,
  width = 3,
  from,
  to,
  dashed,
  samples = 360,
  opacity = 1,
}: {
  f: Fn;
  color?: string;
  width?: number;
  from?: number;
  to?: number;
  dashed?: boolean;
  samples?: number;
  opacity?: number;
}) {
  const { xMin, xMax, yMin, yMax, sx, sy } = usePlot();
  const a = from ?? xMin;
  const b = to ?? xMax;
  const span = yMax - yMin;
  let d = '';
  let pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples;
    const y = f(x);
    if (!isFinite(y) || y > yMax + 4 * span || y < yMin - 4 * span) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`;
    pen = true;
  }
  return (
    <path
      d={d}
      fill="none"
      style={{ stroke: color, opacity }}
      strokeWidth={width}
      strokeDasharray={dashed ? '7 6' : undefined}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

export function AreaFill({
  f,
  g = () => 0,
  from,
  to,
  color = C.area,
  opacity = 0.35,
  samples = 200,
}: {
  f: Fn;
  g?: Fn;
  from: number;
  to: number;
  color?: string;
  opacity?: number;
  samples?: number;
}) {
  const { sx, sy } = usePlot();
  if (to <= from) return null;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples;
    top.push(`${sx(x).toFixed(2)},${sy(f(x)).toFixed(2)}`);
    bot.push(`${sx(x).toFixed(2)},${sy(g(x)).toFixed(2)}`);
  }
  return <polygon points={[...top, ...bot.reverse()].join(' ')} style={{ fill: color, opacity }} />;
}

export function Seg({
  x1, y1, x2, y2, color = C.text, width = 2, dashed, opacity = 1,
}: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dashed?: boolean; opacity?: number }) {
  const { sx, sy } = usePlot();
  return (
    <line
      x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)}
      style={{ stroke: color, opacity }}
      strokeWidth={width}
      strokeDasharray={dashed ? '6 6' : undefined}
      strokeLinecap="round"
    />
  );
}

/** Infinite line through (x0, y0) with slope m, clipped to the view. */
export function SlopeLine({ x0, y0, m, color = C.tangent, width = 2.5, dashed }: { x0: number; y0: number; m: number; color?: string; width?: number; dashed?: boolean }) {
  const { xMin, xMax } = usePlot();
  const pad = (xMax - xMin) * 2;
  return <Seg x1={xMin - pad} y1={y0 + m * (xMin - pad - x0)} x2={xMax + pad} y2={y0 + m * (xMax + pad - x0)} color={color} width={width} dashed={dashed} />;
}

export function Dot({ x, y, r = 6, color = C.tangent, stroke = C.bg, opacity = 1 }: { x: number; y: number; r?: number; color?: string; stroke?: string; opacity?: number }) {
  const { sx, sy } = usePlot();
  if (!isFinite(x) || !isFinite(y)) return null;
  return <circle cx={sx(x)} cy={sy(y)} r={r} style={{ fill: color, stroke, opacity }} strokeWidth={2} />;
}

export function DataRect({ x, y, w, h, color = C.area, opacity = 0.45, stroke }: { x: number; y: number; w: number; h: number; color?: string; opacity?: number; stroke?: string }) {
  const { sx, sy } = usePlot();
  const X = sx(x);
  const Y1 = sy(y);
  const Y2 = sy(y + h);
  return (
    <rect
      x={X}
      y={Math.min(Y1, Y2)}
      width={Math.max(0, sx(x + w) - X)}
      height={Math.abs(Y2 - Y1)}
      style={{ fill: color, fillOpacity: opacity, stroke: stroke ?? color }}
      strokeWidth={1}
    />
  );
}

export function TextAt({ x, y, children, dx = 0, dy = 0, anchor = 'start', color = C.text, size = 14 }: { x: number; y: number; children: ReactNode; dx?: number; dy?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; size?: number }) {
  const { sx, sy } = usePlot();
  return (
    <text x={sx(x) + dx} y={sy(y) + dy} textAnchor={anchor} className="plot-text" style={{ fill: color, fontSize: size }}>
      {children}
    </text>
  );
}

export function Arrow({ x1, y1, x2, y2, color = C.secant, width = 3 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number }) {
  const { sx, sy } = usePlot();
  const X1 = sx(x1), Y1 = sy(y1), X2 = sx(x2), Y2 = sy(y2);
  const ang = Math.atan2(Y2 - Y1, X2 - X1);
  const len = Math.hypot(X2 - X1, Y2 - Y1);
  if (len < 2) return null;
  const head = Math.min(14, len * 0.5);
  const p = (a: number) => `${X2 - head * Math.cos(ang + a)},${Y2 - head * Math.sin(ang + a)}`;
  return (
    <g style={{ stroke: color, fill: color }}>
      <line x1={X1} y1={Y1} x2={X2 - (head / 2) * Math.cos(ang)} y2={Y2 - (head / 2) * Math.sin(ang)} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${X2},${Y2} ${p(0.45)} ${p(-0.45)}`} strokeWidth={1} />
    </g>
  );
}

/** A draggable point. Pointer events are captured so dragging works on touch too. */
export function Handle({
  x,
  y,
  onDrag,
  color = C.tangent,
  r = 9,
  lockX,
  lockY,
}: {
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
  color?: string;
  r?: number;
  lockX?: boolean;
  lockY?: boolean;
}) {
  const p = usePlot();
  const dragging = useRef(false);
  const move = (e: RPointerEvent) => {
    if (!dragging.current || !p.svg.current) return;
    const q = toSvg(p.svg.current, e.clientX, e.clientY);
    onDrag(lockX ? x : clamp(p.ix(q.x), p.xMin, p.xMax), lockY ? y : clamp(p.iy(q.y), p.yMin, p.yMax));
  };
  return (
    <g
      className="handle"
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={(e) => {
        e.stopPropagation();
        dragging.current = false;
      }}
      onPointerCancel={() => (dragging.current = false)}
    >
      <circle cx={p.sx(x)} cy={p.sy(y)} r={r + 14} fill="transparent" />
      <circle cx={p.sx(x)} cy={p.sy(y)} r={r + 5} className="handle-ring" style={{ stroke: color }} />
      <circle cx={p.sx(x)} cy={p.sy(y)} r={r} style={{ fill: color, stroke: C.bg }} strokeWidth={2} />
    </g>
  );
}
