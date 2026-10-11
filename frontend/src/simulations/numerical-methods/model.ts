import { num, str, type ParamState } from '../../core/types';

export interface RootProblem {
  label: string;
  tex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  bracket: [number, number];
  view: { x: [number, number]; y: [number, number] };
}

export const PROBLEMS = {
  sqrt2: {
    label: 'x² − 2',
    tex: 'x^2 - 2',
    f: (x) => x * x - 2,
    df: (x) => 2 * x,
    bracket: [1, 2],
    view: { x: [-0.5, 3.5], y: [-3, 7] },
  },
  cubic: {
    label: 'x³ − 2x − 5',
    tex: 'x^3 - 2x - 5',
    f: (x) => x ** 3 - 2 * x - 5,
    df: (x) => 3 * x * x - 2,
    bracket: [2, 3],
    view: { x: [-1, 3.5], y: [-9, 15] },
  },
  cosx: {
    label: 'cos x − x',
    tex: '\\cos x - x',
    f: (x) => Math.cos(x) - x,
    df: (x) => -Math.sin(x) - 1,
    bracket: [0, 1],
    view: { x: [-1, 2.5], y: [-3, 2] },
  },
  exp3: {
    label: 'eˣ − 3',
    tex: 'e^x - 3',
    f: (x) => Math.exp(x) - 3,
    df: (x) => Math.exp(x),
    bracket: [0, 2],
    view: { x: [-1, 2.6], y: [-3.5, 8] },
  },
} satisfies Record<string, RootProblem>;

export type ProblemKey = keyof typeof PROBLEMS;
export const problemOf = (k: unknown): RootProblem => PROBLEMS[(k as ProblemKey) in PROBLEMS ? (k as ProblemKey) : 'sqrt2'];

/** Referans kök: 80 adımlık ikiye bölme (makine hassasiyeti). */
export function trueRoot(p: RootProblem): number {
  let [a, b] = p.bracket;
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2;
    if (Math.sign(p.f(m)) === Math.sign(p.f(a))) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

export function newton(p: RootProblem, x0: number, k: number): number[] {
  const xs = [x0];
  let x = x0;
  for (let i = 0; i < k; i++) {
    const d = p.df(x);
    if (d === 0 || !Number.isFinite(d)) break;
    x = x - p.f(x) / d;
    xs.push(x);
    if (!Number.isFinite(x) || Math.abs(x) > 1e8) break;
  }
  return xs;
}

export function bisection(p: RootProblem, k: number): [number, number][] {
  let [a, b] = p.bracket;
  const out: [number, number][] = [[a, b]];
  for (let i = 0; i < k; i++) {
    const m = (a + b) / 2;
    if (p.f(m) === 0) {
      a = b = m;
    } else if (Math.sign(p.f(m)) === Math.sign(p.f(a))) a = m;
    else b = m;
    out.push([a, b]);
  }
  return out;
}

export function numState(p: ParamState) {
  const prob = problemOf(str(p, 'fn'));
  const k = Math.round(num(p, 'k'));
  const x0 = num(p, 'x0');
  const root = trueRoot(prob);
  const nx = newton(prob, x0, k);
  const bis = bisection(prob, k);
  const last = bis[bis.length - 1];
  return {
    prob,
    k,
    x0,
    root,
    newton: nx,
    bisection: bis,
    newtonX: nx[nx.length - 1],
    bisX: (last[0] + last[1]) / 2,
    width: last[1] - last[0],
    method: str(p, 'method'),
  };
}
