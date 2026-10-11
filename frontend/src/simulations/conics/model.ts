import { num, str, type ParamState } from '../../core/types';

export type Pt = [number, number];

export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export interface Conic {
  type: 'ellipse' | 'hyperbola' | 'parabola';
  a: number;
  b: number;
  p: number;
  c: number;
  e: number;
  foci: Pt[];
  /** Doğrultman: x = ±d (elips/hiperbol) veya y = −p (parabol). */
  directrix: number;
  point: Pt;
  /** P'deki teğet doğrultusu (birim vektör). */
  tangent: Pt;
}

export function conicOf(p: ParamState): Conic {
  const type = (str(p, 'type') as Conic['type']) || 'ellipse';
  const a = num(p, 'a');
  const b = num(p, 'b');
  const fp = num(p, 'p');
  const t = num(p, 't');
  if (type === 'parabola') {
    const x = Math.max(-6, Math.min(6, t));
    const point: Pt = [x, (x * x) / (4 * fp)];
    const slope = x / (2 * fp);
    const n = Math.hypot(1, slope);
    return { type, a, b, p: fp, c: fp, e: 1, foci: [[0, fp]], directrix: -fp, point, tangent: [1 / n, slope / n] };
  }
  if (type === 'hyperbola') {
    const c = Math.sqrt(a * a + b * b);
    const u = Math.max(-2.2, Math.min(2.2, t));
    const point: Pt = [a * Math.cosh(u), b * Math.sinh(u)];
    const d: Pt = [a * Math.sinh(u), b * Math.cosh(u)];
    const n = Math.hypot(...d);
    return { type, a, b, p: fp, c, e: c / a, foci: [[-c, 0], [c, 0]], directrix: (a * a) / c, point, tangent: [d[0] / n, d[1] / n] };
  }
  // Elips: büyük eksen yatay ya da dikey olabilir.
  const horizontal = a >= b;
  const c = Math.sqrt(Math.abs(a * a - b * b));
  const major = horizontal ? a : b;
  const point: Pt = [a * Math.cos(t), b * Math.sin(t)];
  const d: Pt = [-a * Math.sin(t), b * Math.cos(t)];
  const n = Math.hypot(...d) || 1;
  return {
    type: 'ellipse',
    a,
    b,
    p: fp,
    c,
    e: c / major,
    foci: horizontal ? [[-c, 0], [c, 0]] : [[0, -c], [0, c]],
    directrix: c > 1e-9 ? (major * major) / c : Infinity,
    point,
    tangent: [d[0] / n, d[1] / n],
  };
}

/** Sürüklenen noktayı eğri üzerindeki parametreye çevirir. */
export function paramFromPoint(type: Conic['type'], a: number, b: number, [x, y]: Pt): number {
  if (type === 'parabola') return Math.round(x * 20) / 20;
  if (type === 'hyperbola') return Math.asinh(y / b);
  return Math.atan2(y / b, x / a);
}
