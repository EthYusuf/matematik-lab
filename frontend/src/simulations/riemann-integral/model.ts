import { riemannSum, type RealFn, type RiemannRule } from '../../core/math/calculus';
import { num, str, type ParamState } from '../../core/types';

export interface IntegrandPreset {
  label: string;
  f: RealFn;
  /** Ters türev: kesin integral F(b) − F(a) ile hesaplanır. */
  F: RealFn;
  tex: string;
  Ftex: string;
}

export const INTEGRANDS = {
  square: {
    label: 'x²',
    f: (x) => x * x,
    F: (x) => x ** 3 / 3,
    tex: 'x^2',
    Ftex: '\\frac{x^3}{3}',
  },
  sqrt: {
    label: '√x',
    f: (x) => Math.sqrt(Math.max(0, x)),
    F: (x) => (2 / 3) * Math.max(0, x) ** 1.5,
    tex: '\\sqrt{x}',
    Ftex: '\\tfrac{2}{3}x^{3/2}',
  },
  wave: {
    label: 'sin x + 1',
    f: (x) => Math.sin(x) + 1,
    F: (x) => x - Math.cos(x),
    tex: '\\sin x + 1',
    Ftex: 'x - \\cos x',
  },
  hill: {
    label: '4 − x²',
    f: (x) => 4 - x * x,
    F: (x) => 4 * x - x ** 3 / 3,
    tex: '4 - x^2',
    Ftex: '4x - \\frac{x^3}{3}',
  },
} satisfies Record<string, IntegrandPreset>;

export type IntegrandKey = keyof typeof INTEGRANDS;

export const RULE_LABELS: Record<RiemannRule, string> = { left: 'Sol', right: 'Sağ', mid: 'Orta', trapezoid: 'Yamuk' };

export const integrandOf = (k: unknown): IntegrandPreset => INTEGRANDS[(k as IntegrandKey) in INTEGRANDS ? (k as IntegrandKey) : 'square'];

export interface IntegralState {
  fn: IntegrandPreset;
  a: number;
  b: number;
  n: number;
  rule: RiemannRule;
  dx: number;
  approx: number;
  exact: number;
  error: number;
}

export function integralState(p: ParamState): IntegralState {
  const fn = integrandOf(p.fn);
  const a = num(p, 'a');
  const b = num(p, 'b');
  const n = Math.max(1, Math.round(num(p, 'n')));
  const rule = str(p, 'rule') as RiemannRule;
  const approx = riemannSum(fn.f, a, b, n, rule);
  const exact = fn.F(b) - fn.F(a);
  return { fn, a, b, n, rule, dx: (b - a) / n, approx, exact, error: approx - exact };
}

/** n = 1…maxN için |hata| (log10) — hata grafiği. */
export function errorCurve(fn: IntegrandPreset, a: number, b: number, rule: RiemannRule, maxN = 100): [number, number][] {
  const exact = fn.F(b) - fn.F(a);
  const pts: [number, number][] = [];
  for (let n = 1; n <= maxN; n++) {
    const e = Math.abs(riemannSum(fn.f, a, b, n, rule) - exact);
    pts.push([n, Math.log10(Math.max(e, 1e-7))]);
  }
  return pts;
}
