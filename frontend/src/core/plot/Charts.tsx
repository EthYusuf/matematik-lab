import { useId, type ReactNode } from 'react';
import { fmt } from '../math/format';
import { useWidth } from './theme';

const PAD = { l: 42, r: 14, t: 12, b: 28 };

function niceTicks(lo: number, hi: number, count = 4): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count + 0.5) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.abs(v) < 1e-12 ? 0 : v);
  return ticks;
}

interface Frame {
  width: number;
  height: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
}

function Axes({
  frame,
  xTicks,
  yTicks,
  xFormat,
  yFormat,
  xLabel,
  yLabel,
}: {
  frame: Frame;
  xTicks: number[];
  yTicks: number[];
  xFormat: (v: number) => string;
  yFormat: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
}) {
  const { width, height, sx, sy } = frame;
  return (
    <g fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-3)">
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={PAD.l} x2={width - PAD.r} y1={sy(t)} y2={sy(t)} stroke="var(--rule)" strokeWidth="1" />
          <text x={PAD.l - 6} y={sy(t) + 3.5} textAnchor="end">
            {yFormat(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={sx(t)} y={height - PAD.b + 15} textAnchor="middle">
          {xFormat(t)}
        </text>
      ))}
      <line x1={PAD.l} x2={width - PAD.r} y1={height - PAD.b} y2={height - PAD.b} stroke="var(--ink-3)" strokeWidth="1" />
      {xLabel && (
        <text x={width - PAD.r} y={height - 2} textAnchor="end" fontStyle="italic">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={4} y={PAD.t - 2} fontStyle="italic">
          {yLabel}
        </text>
      )}
    </g>
  );
}

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  bars: Bar[];
  /** Kuramsal değerler: çubukların üzerine nokta-çizgi olarak çizilir. */
  expected?: number[];
  height?: number;
  yMax?: number;
  color?: string;
  expectedColor?: string;
  labelEvery?: number;
  yFormat?: (v: number) => string;
  ariaLabel: string;
  children?: ReactNode;
}

export function BarChart({
  bars,
  expected,
  height = 220,
  yMax,
  color = 'var(--c-fn)',
  expectedColor = 'var(--c-hot)',
  labelEvery = 1,
  yFormat = (v) => fmt(v, 2),
  ariaLabel,
}: BarChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const top = Math.max(yMax ?? 0, ...bars.map((b) => b.value), ...(expected ?? [0])) || 1;
  const n = bars.length;
  const innerW = width - PAD.l - PAD.r;
  const slot = innerW / Math.max(1, n);
  const sx = (i: number) => PAD.l + slot * (i + 0.5);
  const sy = (v: number) => height - PAD.b - (v / top) * (height - PAD.t - PAD.b);
  const frame: Frame = { width, height, sx, sy };
  const bw = Math.max(1, slot * 0.72);

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        <Axes
          frame={frame}
          xTicks={[]}
          yTicks={niceTicks(0, top)}
          xFormat={String}
          yFormat={yFormat}
        />
        {bars.map((b, i) => (
          <g key={i}>
            <rect
              x={sx(i) - bw / 2}
              y={sy(b.value)}
              width={bw}
              height={Math.max(0, height - PAD.b - sy(b.value))}
              rx={Math.min(3, bw / 4)}
              fill={b.highlight ? 'var(--c-pt)' : color}
              fillOpacity={b.highlight ? 0.95 : 0.78}
            />
            {(i % labelEvery === 0 || n <= 13) && (
              <text x={sx(i)} y={height - PAD.b + 15} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-3)">
                {b.label}
              </text>
            )}
          </g>
        ))}
        {expected && (
          <g>
            <polyline
              points={expected.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')}
              fill="none"
              stroke={expectedColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {expected.map((v, i) => (
              <circle key={i} cx={sx(i)} cy={sy(v)} r={n > 30 ? 0 : 3} fill={expectedColor} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

export interface Series {
  points: [number, number][];
  color: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}

interface LineChartProps {
  series: Series[];
  x: [number, number];
  y: [number, number];
  height?: number;
  xTicks?: number[];
  yTicks?: number[];
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  refLines?: { y?: number; x?: number; color: string; label?: string }[];
  markers?: { x: number; y: number; color: string }[];
  xLabel?: string;
  yLabel?: string;
  ariaLabel: string;
}

export function LineChart({
  series,
  x: [x0, x1],
  y: [y0, y1],
  height = 200,
  xTicks,
  yTicks,
  xFormat = (v) => fmt(v, 2),
  yFormat = (v) => fmt(v, 2),
  refLines = [],
  markers = [],
  xLabel,
  yLabel,
  ariaLabel,
}: LineChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const clipId = `clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0 || 1)) * (width - PAD.l - PAD.r);
  const sy = (v: number) => height - PAD.b - ((v - y0) / (y1 - y0 || 1)) * (height - PAD.t - PAD.b);
  const clampY = (v: number) => Math.min(y1 + (y1 - y0) * 0.05, Math.max(y0 - (y1 - y0) * 0.05, v));
  const frame: Frame = { width, height, sx, sy };

  const path = (pts: [number, number][]) => {
    let d = '';
    let pen = false;
    for (const [px, py] of pts) {
      if (!Number.isFinite(py) || px < x0 || px > x1) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${sx(px).toFixed(1)} ${sy(clampY(py)).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        <Axes
          frame={frame}
          xTicks={xTicks ?? niceTicks(x0, x1, 6)}
          yTicks={yTicks ?? niceTicks(y0, y1)}
          xFormat={xFormat}
          yFormat={yFormat}
          xLabel={xLabel}
          yLabel={yLabel}
        />
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.l} y={PAD.t - 4} width={Math.max(0, width - PAD.l - PAD.r)} height={height - PAD.t - PAD.b + 8} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {refLines.map((r, i) =>
            r.y !== undefined ? (
              <g key={i}>
                <line x1={PAD.l} x2={width - PAD.r} y1={sy(r.y)} y2={sy(r.y)} stroke={r.color} strokeDasharray="5 4" strokeWidth="1.5" />
                {r.label && (
                  <text x={width - PAD.r - 4} y={sy(r.y) - 5} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10.5" fill={r.color}>
                    {r.label}
                  </text>
                )}
              </g>
            ) : (
              <line key={i} x1={sx(r.x!)} x2={sx(r.x!)} y1={PAD.t} y2={height - PAD.b} stroke={r.color} strokeDasharray="5 4" strokeWidth="1.5" />
            ),
          )}
          {series.map((s, i) => (
            <path
              key={i}
              d={path(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeOpacity={s.opacity ?? 1}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {markers.map((m, i) => (
            <circle key={i} cx={sx(m.x)} cy={sy(clampY(m.y))} r="4.5" fill={m.color} stroke="var(--bg-elev)" strokeWidth="1.5" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Simülasyon üzerinde küçük bilgi etiketi. */
export function StageNote({ children, tone = 'text-ink-2' }: { children: ReactNode; tone?: string }) {
  return <p className={`rounded-md bg-elev/85 px-2 py-1 font-mono text-[12px] backdrop-blur-sm ${tone}`}>{children}</p>;
}

/** Simülasyon üzerindeki eylem düğmesi (▶ Döndür, h → 0 gibi). */
export function StageButton({ children, onClick, pressed }: { children: ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="pointer-events-auto rounded-md border border-hot bg-elev/90 px-2.5 py-1 font-mono text-[12px] font-medium text-hot backdrop-blur-sm transition-colors hover:bg-hot hover:text-bg"
    >
      {children}
    </button>
  );
}

/**
 * Bir simülasyonun altındaki ikinci panel için başlık şeridi.
 * Büyük harfe çevrilmez: matematik simgeleri (μ → Μ, n → N) anlam değiştirir.
 */
export function PanelTitle({ children }: { children: ReactNode }) {
  return <p className="px-4 pt-3 font-mono text-[11.5px] font-medium tracking-[0.04em] text-ink-3">{children}</p>;
}
