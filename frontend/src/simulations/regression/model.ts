import { bool, num, type ParamState } from '../../core/types';

export type Pt = [number, number];
export const N_POINTS = 6;

export const DEFAULT_POINTS: Pt[] = [
  [1, 1.5],
  [2, 2.6],
  [3, 2.4],
  [4.5, 4.2],
  [6, 4.4],
  [7, 5.6],
];

export const pointsOf = (p: ParamState): Pt[] => Array.from({ length: N_POINTS }, (_, i) => [num(p, `p${i}x`), num(p, `p${i}y`)]);

export interface Fit {
  m: number;
  b: number;
  r2: number;
  sse: number;
}

/** En küçük kareler doğrusu: Σ(yᵢ − (m xᵢ + b))² en küçük olacak şekilde. */
export function leastSquares(pts: Pt[]): Fit {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
  const syy = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0);
  const m = sxx === 0 ? 0 : sxy / sxx;
  const b = my - m * mx;
  const sse = sseOf(pts, m, b);
  return { m, b, sse, r2: syy === 0 ? 1 : 1 - sse / syy };
}

export const sseOf = (pts: Pt[], m: number, b: number) => pts.reduce((s, [x, y]) => s + (y - (m * x + b)) ** 2, 0);

export function regState(p: ParamState) {
  const pts = pointsOf(p);
  const fit = leastSquares(pts);
  const user = bool(p, 'userLine');
  const um = num(p, 'm');
  const ub = num(p, 'b');
  return { pts, fit, user, um, ub, userSse: sseOf(pts, um, ub) };
}
