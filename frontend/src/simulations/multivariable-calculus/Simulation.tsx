import { useMemo, useRef } from 'react';
import { fmt } from '../../core/math/format';
import { CanvasStage, type DrawContext } from '../../core/plot/CanvasStage';
import { PanelTitle, StageButton, StageNote } from '../../core/plot/Charts';
import { bool, num, type SimProps } from '../../core/types';
import { mvState, type Surface } from './model';

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128];
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = ([r, g, b]: RGB, k = 1, alpha = 1) => `rgba(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)},${alpha})`;

/** Yükseklik → renk: düşük mavi, orta yeşil, yüksek sarı. */
function ramp(colors: DrawContext['colors']) {
  const lo = hexToRgb(colors.fn);
  const mid = hexToRgb(colors.tan);
  const hi = hexToRgb(colors.pt);
  return (t: number) => (t < 0.5 ? mix(lo, mid, t * 2) : mix(mid, hi, (t - 0.5) * 2));
}

interface Grid {
  n: number;
  xs: number[];
  z: number[][];
  zMin: number;
  zMax: number;
  levels: number[];
}

function buildGrid(s: Surface, n: number): Grid {
  const D = s.domain;
  const xs = Array.from({ length: n + 1 }, (_, i) => -D + (2 * D * i) / n);
  const z = xs.map((x) => xs.map((y) => s.f(x, y)));
  const flat = z.flat().sort((a, b) => a - b);
  // Eş yükselti seviyeleri değer dağılımının yüzdeliklerinden: her fonksiyonda dengeli görünür.
  const levels = Array.from({ length: 14 }, (_, k) => flat[Math.floor(((k + 0.5) / 14) * (flat.length - 1))]);
  return { n, xs, z, zMin: flat[0], zMax: flat[flat.length - 1], levels };
}

export function MultivariableSimulation({ params, setParams, animate }: SimProps) {
  const st = mvState(params);
  const { s, path, start } = st;
  const az = (num(params, 'az') * Math.PI) / 180;
  const el = (num(params, 'el') * Math.PI) / 180;
  const showGrad = bool(params, 'showGrad');
  const surfaceGrid = useMemo(() => buildGrid(s, 34), [s]);
  const contourGrid = useMemo(() => buildGrid(s, 90), [s]);
  const drag = useRef<[number, number] | null>(null);
  const D = s.domain;

  const project = (width: number, height: number, g: Grid) => {
    const scale = Math.min(width, height * 1.25) / (D * 3.1);
    const zScale = (D * 1.1) / (g.zMax - g.zMin || 1);
    const cx = width / 2;
    const cy = height * 0.56;
    return (x: number, y: number, z: number) => {
      const zz = (Math.min(Math.max(z, g.zMin), g.zMax) - (g.zMin + g.zMax) / 2) * zScale;
      const X1 = x * Math.cos(az) - y * Math.sin(az);
      const Y1 = x * Math.sin(az) + y * Math.cos(az);
      const Z2 = Y1 * Math.sin(el) + zz * Math.cos(el);
      const depth = Y1 * Math.cos(el) - zz * Math.sin(el);
      return { px: cx + X1 * scale, py: cy - Z2 * scale, depth, zz };
    };
  };

  const draw3d = ({ ctx, width, height, colors }: DrawContext) => {
    const g = surfaceGrid;
    const P = project(width, height, g);
    const color = ramp(colors);
    const quads: { pts: { px: number; py: number }[]; depth: number; t: number; light: number }[] = [];
    const L = [-0.45, -0.35, 0.82];
    for (let i = 0; i < g.n; i++) {
      for (let j = 0; j < g.n; j++) {
        const c = [
          [g.xs[i], g.xs[j], g.z[i][j]],
          [g.xs[i + 1], g.xs[j], g.z[i + 1][j]],
          [g.xs[i + 1], g.xs[j + 1], g.z[i + 1][j + 1]],
          [g.xs[i], g.xs[j + 1], g.z[i][j + 1]],
        ];
        const pr = c.map(([x, y, z]) => P(x, y, z));
        const zAvg = (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4;
        // Yüzey normali (dünya koordinatında, yükseklik ölçeğiyle)
        const zs = (D * 1.1) / (g.zMax - g.zMin || 1);
        const ux = c[1][0] - c[0][0];
        const uz = (c[1][2] - c[0][2]) * zs;
        const vy = c[3][1] - c[0][1];
        const vz = (c[3][2] - c[0][2]) * zs;
        const nx = -uz * vy;
        const ny = -ux * vz;
        const nz = ux * vy;
        const nl = Math.hypot(nx, ny, nz) || 1;
        const lambert = Math.abs((nx * L[0] + ny * L[1] + nz * L[2]) / nl);
        quads.push({ pts: pr, depth: pr.reduce((a, b) => a + b.depth, 0) / 4, t: (zAvg - g.zMin) / (g.zMax - g.zMin || 1), light: 0.55 + 0.45 * lambert });
      }
    }
    quads.sort((a, b) => b.depth - a.depth);
    ctx.lineWidth = 0.5;
    for (const q of quads) {
      ctx.beginPath();
      q.pts.forEach((p, k) => (k ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py)));
      ctx.closePath();
      const c = color(q.t);
      ctx.fillStyle = rgb(c, q.light);
      ctx.fill();
      ctx.strokeStyle = rgb(c, q.light * 0.82, 0.9);
      ctx.stroke();
    }
    // Gradient descent yolu yüzeyin üzerinde
    const pts = path.filter(([x, y]) => Math.abs(x) <= D * 1.05 && Math.abs(y) <= D * 1.05).map(([x, y]) => P(x, y, s.f(x, y)));
    ctx.strokeStyle = colors.hot;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    pts.forEach((p, k) => (k ? ctx.lineTo(p.px, p.py - 2) : ctx.moveTo(p.px, p.py - 2)));
    ctx.stroke();
    pts.forEach((p, k) => {
      ctx.fillStyle = k === 0 ? colors.ink : k === pts.length - 1 ? colors.pt : colors.hot;
      ctx.beginPath();
      ctx.arc(p.px, p.py - 2, k === 0 || k === pts.length - 1 ? 5 : 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawContour = ({ ctx, width, height, colors }: DrawContext) => {
    const g = contourGrid;
    const size = Math.min(width - 24, height - 24);
    const ox = (width - size) / 2;
    const oy = (height - size) / 2;
    const toPx = (x: number, y: number): [number, number] => [ox + ((x + D) / (2 * D)) * size, oy + ((D - y) / (2 * D)) * size];
    const color = ramp(colors);
    const cell = size / g.n;
    for (let i = 0; i < g.n; i++) {
      for (let j = 0; j < g.n; j++) {
        const t = (g.z[i][j] - g.zMin) / (g.zMax - g.zMin || 1);
        ctx.fillStyle = rgb(color(Math.sqrt(t)), 1, 0.34);
        const [px, py] = toPx(g.xs[i], g.xs[j + 1]);
        ctx.fillRect(px, py, cell + 0.6, cell + 0.6);
      }
    }
    // Marching squares ile eş yükselti çizgileri
    ctx.strokeStyle = rgb(hexToRgb(colors.ink), 1, 0.45);
    ctx.lineWidth = 1;
    for (const level of g.levels) {
      ctx.beginPath();
      for (let i = 0; i < g.n; i++) {
        for (let j = 0; j < g.n; j++) {
          const v = [g.z[i][j], g.z[i + 1][j], g.z[i + 1][j + 1], g.z[i][j + 1]];
          const c = [
            [g.xs[i], g.xs[j]],
            [g.xs[i + 1], g.xs[j]],
            [g.xs[i + 1], g.xs[j + 1]],
            [g.xs[i], g.xs[j + 1]],
          ];
          const pts: [number, number][] = [];
          for (let e = 0; e < 4; e++) {
            const a = v[e] - level;
            const b = v[(e + 1) % 4] - level;
            if ((a < 0) !== (b < 0)) {
              const t = a / (a - b);
              const p0 = c[e];
              const p1 = c[(e + 1) % 4];
              pts.push(toPx(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t));
            }
          }
          if (pts.length >= 2) {
            ctx.moveTo(pts[0][0], pts[0][1]);
            ctx.lineTo(pts[1][0], pts[1][1]);
            if (pts.length === 4) {
              ctx.moveTo(pts[2][0], pts[2][1]);
              ctx.lineTo(pts[3][0], pts[3][1]);
            }
          }
        }
      }
      ctx.stroke();
    }
    // Eksenler
    ctx.strokeStyle = colors.ink3;
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, size, size);
    const [ax, ay] = toPx(0, 0);
    ctx.beginPath();
    ctx.moveTo(ox, ay);
    ctx.lineTo(ox + size, ay);
    ctx.moveTo(ax, oy);
    ctx.lineTo(ax, oy + size);
    ctx.stroke();
    // Yol
    ctx.strokeStyle = colors.hot;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    path.forEach(([x, y], k) => {
      const [px, py] = toPx(Math.max(-D * 1.2, Math.min(D * 1.2, x)), Math.max(-D * 1.2, Math.min(D * 1.2, y)));
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.stroke();
    path.forEach(([x, y], k) => {
      if (Math.abs(x) > D || Math.abs(y) > D) return;
      const [px, py] = toPx(x, y);
      ctx.fillStyle = k === 0 ? colors.ink : k === path.length - 1 ? colors.pt : colors.hot;
      ctx.beginPath();
      ctx.arc(px, py, k === 0 || k === path.length - 1 ? 5 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    // Gradyan oku (en hızlı artış yönü)
    if (showGrad) {
      const [gx, gy] = s.grad(start[0], start[1]);
      const len = Math.hypot(gx, gy);
      if (len > 1e-9) {
        const k = Math.min(1.2, len) / len;
        const [x0, y0] = toPx(start[0], start[1]);
        const [x1, y1] = toPx(start[0] + gx * k, start[1] + gy * k);
        ctx.strokeStyle = colors.ink;
        ctx.fillStyle = colors.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const ang = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 10 * Math.cos(ang - 0.4), y1 - 10 * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - 10 * Math.cos(ang + 0.4), y1 - 10 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('∇f', x1 + 6, y1 - 6);
      }
    }
  };

  const onContour = (px: number, py: number, kind: string, width: number) => {
    if (kind === 'up') return;
    const height = 380;
    const size = Math.min(width - 24, height - 24);
    const ox = (width - size) / 2;
    const oy = (height - size) / 2;
    const x = ((px - ox) / size) * 2 * D - D;
    const y = D - ((py - oy) / size) * 2 * D;
    if (Math.abs(x) > D || Math.abs(y) > D) return;
    setParams({ px: Math.round(x * 10) / 10, py: Math.round(y * 10) / 10 });
  };

  const on3d = (px: number, py: number, kind: string) => {
    if (kind === 'down') drag.current = [px, py];
    else if (kind === 'move' && drag.current) {
      const [lx, ly] = drag.current;
      drag.current = [px, py];
      setParams((p) => ({
        az: (Number(p.az) + (px - lx) * 0.5 + 360) % 360,
        el: Math.max(5, Math.min(85, Number(p.el) + (py - ly) * 0.4)),
      }));
    } else drag.current = null;
  };

  return (
    <div className="relative">
      <div className="grid lg:grid-cols-2">
        <div className="relative">
          <PanelTitle>3B yüzey · sürükleyerek döndür</PanelTitle>
          <CanvasStage height={380} draw={draw3d} onPointer={on3d} ariaLabel={`${s.label} yüzeyinin üç boyutlu görünümü`} />
        </div>
        <div className="relative border-t border-dashed border-rule-strong lg:border-t-0 lg:border-l">
          <PanelTitle>Eş yükselti haritası · başlangıç noktası için tıkla</PanelTitle>
          <CanvasStage height={380} draw={drawContour} onPointer={onContour} ariaLabel={`${s.label} yüzeyinin eş yükselti haritası`} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
        <StageNote>
          {st.steps} adım · η = {fmt(st.lr, 3)} · son nokta ({fmt(st.end[0], 2)}, {fmt(st.end[1], 2)}) · f = {fmt(s.f(st.end[0], st.end[1]), 4)}
        </StageNote>
        <StageButton onClick={() => animate({ key: 'steps', to: 40, durationMs: 3000 })}>adım at ▶</StageButton>
      </div>
    </div>
  );
}

