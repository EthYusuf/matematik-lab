import { num, str, type ParamState } from '../../core/types';

export const COMPOUNDING: { value: string; label: string; n: number }[] = [
  { value: '1', label: 'yıllık', n: 1 },
  { value: '4', label: '3 ayda bir', n: 4 },
  { value: '12', label: 'aylık', n: 12 },
  { value: '365', label: 'günlük', n: 365 },
  { value: 'cont', label: 'sürekli', n: Infinity },
];

export interface GrowthModel {
  kind: 'interest' | 'decay';
  P: number;
  f: (t: number) => number;
  /** İkiye katlanma (faiz) veya yarı ömür (bozunma) süresi. */
  characteristic: number;
  n: number;
  r: number;
  T: number;
}

export function compound(P: number, r: number, n: number, t: number): number {
  return Number.isFinite(n) ? P * (1 + r / n) ** (n * t) : P * Math.exp(r * t);
}

export function modelOf(p: ParamState): GrowthModel {
  const kind = str(p, 'model') === 'decay' ? 'decay' : 'interest';
  const P = num(p, 'P');
  const r = num(p, 'r');
  const T = num(p, 'T');
  const n = COMPOUNDING.find((c) => c.value === str(p, 'comp'))?.n ?? 1;
  if (kind === 'decay') return { kind, P, r, T, n, f: (t) => P * 0.5 ** (t / T), characteristic: T };
  const doubling = r <= 0 ? Infinity : Number.isFinite(n) ? Math.log(2) / (n * Math.log(1 + r / n)) : Math.log(2) / r;
  return { kind, P, r, T, n, f: (t) => compound(P, r, n, t), characteristic: doubling };
}
