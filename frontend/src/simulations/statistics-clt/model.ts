import { createRng } from '../../core/math/rng';

type Rng = () => number;

/** Box–Muller ile standart normal örnek. */
export function gauss(rng: Rng): number {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface Population {
  label: string;
  mu: number;
  sigma: number;
  range: [number, number];
  sample: (rng: Rng) => number;
  density: (x: number) => number;
  discrete?: boolean;
}

const normalPdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

export const POPULATIONS = {
  uniform: {
    label: 'Düzgün',
    mu: 0.5,
    sigma: Math.sqrt(1 / 12),
    range: [0, 1],
    sample: (rng: Rng) => rng(),
    density: (x: number) => (x >= 0 && x <= 1 ? 1 : 0),
  },
  exponential: {
    label: 'Üstel (çarpık)',
    mu: 1,
    sigma: 1,
    range: [0, 4],
    sample: (rng: Rng) => -Math.log(1 - rng()),
    density: (x: number) => (x >= 0 ? Math.exp(-x) : 0),
  },
  bimodal: {
    label: 'İki tepeli',
    mu: 0.5,
    sigma: Math.sqrt(0.08 ** 2 + 0.25 ** 2),
    range: [0, 1],
    sample: (rng: Rng) => (rng() < 0.5 ? 0.25 : 0.75) + 0.08 * gauss(rng),
    density: (x: number) => 0.5 * normalPdf(x, 0.25, 0.08) + 0.5 * normalPdf(x, 0.75, 0.08),
  },
  dice: {
    label: 'Zar',
    mu: 3.5,
    sigma: Math.sqrt(35 / 12),
    range: [0.5, 6.5],
    sample: (rng: Rng) => 1 + Math.floor(rng() * 6),
    density: (x: number) => (x >= 0.5 && x <= 6.5 ? 1 / 6 : 0),
    discrete: true,
  },
} satisfies Record<string, Population>;

export type PopKey = keyof typeof POPULATIONS;
export const populationOf = (k: unknown): Population => POPULATIONS[(k as PopKey) in POPULATIONS ? (k as PopKey) : 'exponential'];

// Grafik, okumalar ve görev denetimi aynı örneklemi ister: son birkaç sonucu önbellekte tut.
const cache = new Map<string, number[]>();

export function sampleMeans(pop: Population, n: number, m: number, seed: number): number[] {
  const key = `${pop.label}|${n}|${m}|${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out = computeMeans(pop, n, m, seed);
  cache.set(key, out);
  if (cache.size > 6) cache.delete(cache.keys().next().value!);
  return out;
}

function computeMeans(pop: Population, n: number, m: number, seed: number): number[] {
  const rng = createRng(seed);
  const out = new Array<number>(m);
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += pop.sample(rng);
    out[i] = s / n;
  }
  return out;
}

export function describe(xs: number[]): { mean: number; sd: number; skew: number } {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  let m2 = 0;
  let m3 = 0;
  for (const x of xs) {
    const d = x - mean;
    m2 += d * d;
    m3 += d * d * d;
  }
  m2 /= n;
  m3 /= n;
  return { mean, sd: Math.sqrt(m2), skew: m2 > 0 ? m3 / m2 ** 1.5 : 0 };
}

export function histogram(xs: number[], [lo, hi]: [number, number], bins: number): number[] {
  const counts = new Array(bins).fill(0);
  const w = (hi - lo) / bins;
  for (const x of xs) {
    const k = Math.floor((x - lo) / w);
    if (k >= 0 && k < bins) counts[k]++;
    else if (x === hi) counts[bins - 1]++;
  }
  return counts;
}

/** Standart normal birikimli dağılım (Abramowitz–Stegun 7.1.26, hata < 1,5·10⁻⁷). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
