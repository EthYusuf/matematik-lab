import { num, type ParamState } from '../../core/types';

export type Vec = [number, number];

export interface Matrix2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export const matrixOf = (p: ParamState): Matrix2 => ({ a: num(p, 'a'), b: num(p, 'b'), c: num(p, 'c'), d: num(p, 'd') });

export const apply = ({ a, b, c, d }: Matrix2, [x, y]: Vec): Vec => [a * x + b * y, c * x + d * y];
export const det = ({ a, b, c, d }: Matrix2) => a * d - b * c;
export const trace = ({ a, d }: Matrix2) => a + d;

export interface Eigen {
  real: boolean;
  values: number[];
  vectors: Vec[];
  /** Karmaşık özdeğerler için gerçek ve sanal kısım. */
  complex?: { re: number; im: number };
}

export function eigen(m: Matrix2): Eigen {
  const tr = trace(m);
  const dt = det(m);
  const disc = tr * tr - 4 * dt;
  if (disc < -1e-12) return { real: false, values: [], vectors: [], complex: { re: tr / 2, im: Math.sqrt(-disc) / 2 } };
  const s = Math.sqrt(Math.max(0, disc));
  const values = disc < 1e-12 ? [tr / 2] : [(tr + s) / 2, (tr - s) / 2];
  const vectors = values.map((l): Vec => {
    if (Math.abs(m.b) > 1e-12) return normalize([m.b, l - m.a]);
    if (Math.abs(m.c) > 1e-12) return normalize([l - m.d, m.c]);
    return Math.abs(l - m.a) < 1e-12 ? [1, 0] : [0, 1];
  });
  // Köşegen ve λ'ları eşit (ör. birim matris): her yön özvektördür; iki ekseni göster.
  if (values.length === 1 && Math.abs(m.b) < 1e-12 && Math.abs(m.c) < 1e-12) return { real: true, values: [values[0], values[0]], vectors: [[1, 0], [0, 1]] };
  return { real: true, values, vectors };
}

function normalize([x, y]: Vec): Vec {
  const r = Math.hypot(x, y) || 1;
  return [x / r, y / r];
}

export const PRESETS: { label: string; m: Matrix2 }[] = [
  { label: 'Birim', m: { a: 1, b: 0, c: 0, d: 1 } },
  { label: '90° döndür', m: { a: 0, b: -1, c: 1, d: 0 } },
  { label: 'Ölçekle', m: { a: 2, b: 0, c: 0, d: 0.5 } },
  { label: 'Kayma', m: { a: 1, b: 1, c: 0, d: 1 } },
  { label: 'Yansıt', m: { a: -1, b: 0, c: 0, d: 1 } },
  { label: 'Tekil', m: { a: 1, b: 2, c: 0.5, d: 1 } },
];
