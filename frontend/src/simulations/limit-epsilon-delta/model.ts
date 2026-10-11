import type { RealFn } from '../../core/math/calculus';

export interface LimitPreset {
  label: string;
  f: RealFn;
  a: number;
  /** Limit (yoksa null); sağ ve sol limitler ayrıca verilir. */
  L: number | null;
  left: number;
  right: number;
  /** x = a'daki tanımlı değer (yoksa null → grafikte boş daire). */
  valueAtA: number | null;
  tex: string;
  view: { x: [number, number]; y: [number, number] };
}

export const LIMIT_FUNCTIONS = {
  linear: {
    label: '2x + 1',
    f: (x) => 2 * x + 1,
    a: 1,
    L: 3,
    left: 3,
    right: 3,
    valueAtA: 3,
    tex: '2x + 1',
    view: { x: [-1, 3], y: [0, 6] },
  },
  removable: {
    label: '(x² − 1)/(x − 1)',
    f: (x) => (x * x - 1) / (x - 1),
    a: 1,
    L: 2,
    left: 2,
    right: 2,
    valueAtA: null,
    tex: '\\dfrac{x^2 - 1}{x - 1}',
    view: { x: [-1, 3], y: [-0.5, 4.5] },
  },
  sinc: {
    label: 'sin x / x',
    f: (x) => Math.sin(x) / x,
    a: 0,
    L: 1,
    left: 1,
    right: 1,
    valueAtA: null,
    tex: '\\dfrac{\\sin x}{x}',
    view: { x: [-6, 6], y: [-0.6, 1.6] },
  },
  jump: {
    label: 'sıçrama',
    f: (x) => (x < 0 ? x / 2 + 1 : x / 2 + 2),
    a: 0,
    L: null,
    left: 1,
    right: 2,
    valueAtA: 2,
    tex: 'f(x) = \\begin{cases} x/2 + 1 & x < 0 \\\\ x/2 + 2 & x \\ge 0 \\end{cases}',
    view: { x: [-3, 3], y: [-0.5, 3.5] },
  },
} satisfies Record<string, LimitPreset>;

export type LimitKey = keyof typeof LIMIT_FUNCTIONS;
export const limitOf = (k: unknown): LimitPreset => LIMIT_FUNCTIONS[(k as LimitKey) in LIMIT_FUNCTIONS ? (k as LimitKey) : 'removable'];

/**
 * δ, verilen ε için işe yarıyor mu? 0 < |x − a| < δ olan (örneklenmiş) tüm x'lerde |f(x) − L| < ε olmalı.
 * Limit yoksa (sıçrama) L olarak sağ limit denenir.
 */
export function deltaWorks(fn: LimitPreset, eps: number, delta: number, samples = 400): { works: boolean; worst: number } {
  const L = fn.L ?? fn.right;
  let worst = 0;
  for (let i = 1; i <= samples; i++) {
    const d = (delta * i) / samples;
    for (const x of [fn.a - d, fn.a + d]) {
      const y = fn.f(x);
      if (!Number.isFinite(y)) continue;
      worst = Math.max(worst, Math.abs(y - L));
    }
  }
  return { works: worst < eps, worst };
}

/** a'ya soldan ve sağdan yaklaşan değer tablosu. */
export function approachTable(fn: LimitPreset): { h: number; left: number; right: number }[] {
  return [0.1, 0.01, 0.001, 0.0001].map((h) => ({ h, left: fn.f(fn.a - h), right: fn.f(fn.a + h) }));
}
