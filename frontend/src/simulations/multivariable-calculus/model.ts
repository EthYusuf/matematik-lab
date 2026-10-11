import { num, str, type ParamState } from '../../core/types';

export type P2 = [number, number];

export interface Surface {
  label: string;
  tex: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => P2;
  domain: number;
  minima: P2[];
}

export const SURFACES = {
  bowl: {
    label: 'Çanak',
    tex: 'f(x,y) = \\tfrac12(x^2 + y^2)',
    f: (x, y) => (x * x + y * y) / 2,
    grad: (x, y) => [x, y],
    domain: 3,
    minima: [[0, 0]],
  },
  saddle: {
    label: 'Eyer',
    tex: 'f(x,y) = \\tfrac12(x^2 - y^2)',
    f: (x, y) => (x * x - y * y) / 2,
    grad: (x, y) => [x, -y],
    domain: 3,
    minima: [],
  },
  wave: {
    label: 'Dalga',
    tex: 'f(x,y) = \\sin x \\cos y',
    f: (x, y) => Math.sin(x) * Math.cos(y),
    grad: (x, y) => [Math.cos(x) * Math.cos(y), -Math.sin(x) * Math.sin(y)],
    domain: 3.2,
    minima: [[-Math.PI / 2, 0]],
  },
  himmel: {
    label: 'Himmelblau',
    tex: 'f = \\tfrac{1}{100}\\left[(x^2+y-11)^2 + (x+y^2-7)^2\\right]',
    f: (x, y) => ((x * x + y - 11) ** 2 + (x + y * y - 7) ** 2) / 100,
    grad: (x, y) => [(4 * x * (x * x + y - 11) + 2 * (x + y * y - 7)) / 100, (2 * (x * x + y - 11) + 4 * y * (x + y * y - 7)) / 100],
    domain: 5,
    minima: [
      [3, 2],
      [-2.805118, 3.131312],
      [-3.77931, -3.283186],
      [3.584428, -1.848126],
    ],
  },
} satisfies Record<string, Surface>;

export type SurfaceKey = keyof typeof SURFACES;
export const surfaceOf = (k: unknown): Surface => SURFACES[(k as SurfaceKey) in SURFACES ? (k as SurfaceKey) : 'bowl'];

export function descend(s: Surface, start: P2, lr: number, steps: number): P2[] {
  const path: P2[] = [start];
  let [x, y] = start;
  for (let i = 0; i < steps; i++) {
    const [gx, gy] = s.grad(x, y);
    x -= lr * gx;
    y -= lr * gy;
    path.push([x, y]);
    if (!Number.isFinite(x) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
  }
  return path;
}

export function mvState(p: ParamState) {
  const s = surfaceOf(str(p, 'surface'));
  const start: P2 = [num(p, 'px'), num(p, 'py')];
  const steps = Math.round(num(p, 'steps'));
  const lr = num(p, 'lr');
  const path = descend(s, start, lr, steps);
  return { s, start, lr, steps, path, end: path[path.length - 1] };
}
