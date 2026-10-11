import { num, str, type ParamState } from '../../core/types';

export interface Wave {
  label: string;
  target: (t: number) => number;
  /** Sinüs katsayısı b_k (k ≥ 1). */
  b: (k: number) => number;
  btex: string;
}

const wrap = (t: number) => {
  const T = 2 * Math.PI;
  return ((((t + Math.PI) % T) + T) % T) - Math.PI; // (−π, π]
};

export const WAVES = {
  square: {
    label: 'Kare',
    target: (t) => (Math.sin(t) >= 0 ? 1 : -1),
    b: (k) => (k % 2 ? 4 / (k * Math.PI) : 0),
    btex: 'b_k = \\frac{4}{k\\pi}\\ (k \\text{ tek})',
  },
  sawtooth: {
    label: 'Testere',
    target: (t) => wrap(t) / Math.PI,
    b: (k) => (2 * (k % 2 ? 1 : -1)) / (k * Math.PI),
    btex: 'b_k = \\frac{2(-1)^{k+1}}{k\\pi}',
  },
  triangle: {
    label: 'Üçgen',
    target: (t) => (2 / Math.PI) * Math.asin(Math.sin(t)),
    b: (k) => (k % 2 ? (8 / (Math.PI * Math.PI * k * k)) * ((k - 1) / 2 % 2 ? -1 : 1) : 0),
    btex: 'b_k = \\frac{8(-1)^{(k-1)/2}}{\\pi^2 k^2}\\ (k \\text{ tek})',
  },
} satisfies Record<string, Wave>;

export type WaveKey = keyof typeof WAVES;
export const waveOf = (k: unknown): Wave => WAVES[(k as WaveKey) in WAVES ? (k as WaveKey) : 'square'];

export function partialSum(w: Wave, N: number) {
  const bs = Array.from({ length: N }, (_, i) => w.b(i + 1));
  return (t: number) => bs.reduce((s, b, i) => s + b * Math.sin((i + 1) * t), 0);
}

/** [0, 2π] üzerinde karekök ortalama (RMS) hata. */
export function rmsError(w: Wave, N: number, samples = 2000): number {
  const f = partialSum(w, N);
  let s = 0;
  for (let i = 0; i < samples; i++) {
    const t = ((i + 0.5) / samples) * 2 * Math.PI;
    s += (f(t) - w.target(t)) ** 2;
  }
  return Math.sqrt(s / samples);
}

export function fourierState(p: ParamState) {
  const w = waveOf(str(p, 'wave'));
  const N = Math.max(1, Math.round(num(p, 'N')));
  const nonzero = Array.from({ length: N }, (_, i) => w.b(i + 1)).filter((b) => Math.abs(b) > 1e-12).length;
  return { w, N, nonzero, f: partialSum(w, N) };
}
