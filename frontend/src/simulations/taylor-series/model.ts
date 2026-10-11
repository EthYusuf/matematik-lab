import { num, str, type ParamState } from '../../core/types';

const fact = (k: number) => {
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
};

export interface TaylorFn {
  label: string;
  tex: string;
  f: (x: number) => number;
  /** k. türevin a noktasındaki değeri. */
  deriv: (k: number, a: number) => number;
  /** Yakınsaklık yarıçapı (a merkezli). */
  radius: (a: number) => number;
  /** Geçerli merkez (tekilliklerden uzak tutulur). */
  center: (a: number) => number;
  view: { x: [number, number]; y: [number, number] };
}

export const TAYLOR_FUNCS = {
  sin: {
    label: 'sin x',
    tex: '\\sin x',
    f: Math.sin,
    deriv: (k, a) => Math.sin(a + (k * Math.PI) / 2),
    radius: () => Infinity,
    center: (a) => a,
    view: { x: [-7, 7], y: [-3, 3] },
  },
  cos: {
    label: 'cos x',
    tex: '\\cos x',
    f: Math.cos,
    deriv: (k, a) => Math.cos(a + (k * Math.PI) / 2),
    radius: () => Infinity,
    center: (a) => a,
    view: { x: [-7, 7], y: [-3, 3] },
  },
  exp: {
    label: 'eˣ',
    tex: 'e^x',
    f: Math.exp,
    deriv: (_k, a) => Math.exp(a),
    radius: () => Infinity,
    center: (a) => a,
    view: { x: [-4, 3], y: [-1.5, 9] },
  },
  ln1p: {
    label: 'ln(1 + x)',
    tex: '\\ln(1+x)',
    f: (x) => (x > -1 ? Math.log(1 + x) : NaN),
    deriv: (k, a) => (k === 0 ? Math.log(1 + a) : ((k % 2 ? 1 : -1) * fact(k - 1)) / (1 + a) ** k),
    radius: (a) => 1 + a,
    center: (a) => Math.max(a, -0.5),
    view: { x: [-1.5, 4], y: [-3, 2.5] },
  },
  geom: {
    label: '1 / (1 − x)',
    tex: '\\frac{1}{1-x}',
    f: (x) => 1 / (1 - x),
    deriv: (k, a) => fact(k) / (1 - a) ** (k + 1),
    radius: (a) => Math.abs(1 - a),
    center: (a) => (Math.abs(a - 1) < 0.25 ? 0.5 : a),
    view: { x: [-3, 4], y: [-5, 6] },
  },
} satisfies Record<string, TaylorFn>;

export type TaylorKey = keyof typeof TAYLOR_FUNCS;
export const taylorFnOf = (k: unknown): TaylorFn => TAYLOR_FUNCS[(k as TaylorKey) in TAYLOR_FUNCS ? (k as TaylorKey) : 'sin'];

export function coefficients(fn: TaylorFn, a: number, N: number): number[] {
  return Array.from({ length: N + 1 }, (_, k) => fn.deriv(k, a) / fact(k));
}

export function taylor(coeffs: number[], a: number) {
  return (x: number) => {
    let s = 0;
    let p = 1;
    for (const c of coeffs) {
      s += c * p;
      p *= x - a;
    }
    return s;
  };
}

export function taylorState(p: ParamState) {
  const fn = taylorFnOf(str(p, 'fn'));
  const a = fn.center(num(p, 'a'));
  const N = Math.round(num(p, 'N'));
  const coeffs = coefficients(fn, a, N);
  const P = taylor(coeffs, a);
  const x0 = num(p, 'x0');
  return { fn, a, N, coeffs, P, x0, R: fn.radius(a), error: Math.abs(fn.f(x0) - P(x0)) };
}
