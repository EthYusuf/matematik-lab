import { createRng } from '../../core/math/rng';

/** En fazla bu kadar noktayla "koşan frekans" grafiği çizilir. */
const SAMPLES = 220;

function sampleEvery(trials: number) {
  return Math.max(1, Math.floor(trials / SAMPLES));
}

// ---------------- İki zar ----------------

export const diceExpected = Array.from({ length: 11 }, (_, i) => (6 - Math.abs(i + 2 - 7)) / 36);

export interface DiceResult {
  counts: number[]; // toplam 2…12
  running7: [number, number][];
}

export function diceRun(seed: number, trials: number): DiceResult {
  const rng = createRng(seed);
  const counts = new Array(11).fill(0);
  const running7: [number, number][] = [];
  const every = sampleEvery(trials);
  for (let i = 1; i <= trials; i++) {
    const s = 2 + Math.floor(rng() * 6) + Math.floor(rng() * 6);
    counts[s - 2]++;
    if (i % every === 0 || i === trials) running7.push([i, counts[5] / i]);
  }
  return { counts, running7 };
}

// ---------------- Galton tahtası ----------------

export function binomialPmf(n: number, p: number): number[] {
  const out: number[] = [];
  let c = 1; // C(n, k)
  for (let k = 0; k <= n; k++) {
    out.push(c * p ** k * (1 - p) ** (n - k));
    c = (c * (n - k)) / (k + 1);
  }
  return out;
}

export interface GaltonResult {
  bins: number[];
  /** Son birkaç topun her satırdaki konumu (sağa sapma sayısı). */
  paths: number[][];
}

export function galtonRun(seed: number, trials: number, rows: number, p: number, keepPaths = 14): GaltonResult {
  const rng = createRng(seed);
  const bins = new Array(rows + 1).fill(0);
  const paths: number[][] = [];
  for (let i = 0; i < trials; i++) {
    let k = 0;
    const record = i >= trials - keepPaths;
    const path = record ? [0] : [];
    for (let r = 0; r < rows; r++) {
      if (rng() < p) k++;
      if (record) path.push(k);
    }
    bins[k]++;
    if (record) paths.push(path);
  }
  return { bins, paths };
}

// ---------------- Monty Hall ----------------

export interface MontyGame {
  car: number;
  pick: number;
  opened: number;
  final: number;
  win: boolean;
}

export interface MontyResult {
  wins: number;
  running: [number, number][];
  last: MontyGame | null;
}

export function montyRun(seed: number, trials: number, switchDoor: boolean): MontyResult {
  const rng = createRng(seed);
  let wins = 0;
  let last: MontyGame | null = null;
  const running: [number, number][] = [];
  const every = sampleEvery(trials);
  for (let i = 1; i <= trials; i++) {
    const car = Math.floor(rng() * 3);
    const pick = Math.floor(rng() * 3);
    // Sunucu, ne seçilen ne de arabalı kapıyı açar (iki seçenek varsa rastgele).
    const options = [0, 1, 2].filter((d) => d !== pick && d !== car);
    const opened = options[Math.floor(rng() * options.length)];
    const final = switchDoor ? 3 - pick - opened : pick;
    const win = final === car;
    if (win) wins++;
    if (i % every === 0 || i === trials) running.push([i, wins / i]);
    if (i === trials) last = { car, pick, opened, final, win };
  }
  return { wins, running, last };
}

// ---------------- Özet istatistik ----------------

export function binsMeanSd(bins: number[]): { mean: number; sd: number; total: number } {
  const total = bins.reduce((a, b) => a + b, 0);
  if (!total) return { mean: NaN, sd: NaN, total };
  const mean = bins.reduce((s, c, k) => s + c * k, 0) / total;
  const varr = bins.reduce((s, c, k) => s + c * (k - mean) ** 2, 0) / total;
  return { mean, sd: Math.sqrt(varr), total };
}

export const argmax = (xs: number[]) => xs.reduce((best, v, i) => (v > xs[best] ? i : best), 0);
