import type { RealFn } from '../../core/math/calculus';
import { tex } from '../../core/math/format';
import { bool, num, type ParamState } from '../../core/types';

export const BASES = {
  square: { label: 'x²', f: (x: number) => x * x, tex: (u: string) => `(${u})^2` },
  abs: { label: '|x|', f: Math.abs, tex: (u: string) => `|${u}|` },
  sqrt: { label: '√x', f: (x: number) => (x >= 0 ? Math.sqrt(x) : NaN), tex: (u: string) => `\\sqrt{${u}}` },
  cube: { label: 'x³', f: (x: number) => x ** 3, tex: (u: string) => `(${u})^3` },
  sin: { label: 'sin x', f: Math.sin, tex: (u: string) => `\\sin(${u})` },
} satisfies Record<string, { label: string; f: RealFn; tex: (inner: string) => string }>;

export type BaseKey = keyof typeof BASES;
export const baseOf = (k: unknown) => BASES[(k as BaseKey) in BASES ? (k as BaseKey) : 'square'];

export interface Transform {
  h: number;
  v: number;
  k: number;
  m: number;
  flipX: boolean;
  abs: boolean;
}

export const transformOf = (p: ParamState): Transform => ({
  h: num(p, 'h'),
  v: num(p, 'v'),
  k: num(p, 'k'),
  m: num(p, 'm'),
  flipX: bool(p, 'flipX'),
  abs: bool(p, 'absOuter'),
});

/** g(x) = k · f(s·(x − h)) + v, s = ±m; isteğe bağlı |g(x)| */
export function transformed(f: RealFn, t: Transform): RealFn {
  const s = t.flipX ? -t.m : t.m;
  return (x) => {
    const y = t.k * f(s * (x - t.h)) + t.v;
    return t.abs ? Math.abs(y) : y;
  };
}

const isOne = (v: number) => Math.abs(v - 1) < 1e-9;
const isZero = (v: number) => Math.abs(v) < 1e-9;

/** Okunur LaTeX: g(x) = -2\,(x - 3)^2 + 1 */
export function transformTex(baseKey: unknown, t: Transform): string {
  const base = baseOf(baseKey);
  const s = t.flipX ? -t.m : t.m;
  const shift = isZero(t.h) ? 'x' : t.h > 0 ? `x - ${tex(t.h)}` : `x + ${tex(-t.h)}`;
  let inner: string;
  if (isOne(s)) inner = shift;
  else if (isOne(-s)) inner = isZero(t.h) ? '-x' : `-(${shift})`;
  else inner = isZero(t.h) ? `${tex(s)}x` : `${tex(s)}(${shift})`;
  const core = base.tex(inner);
  const k = isOne(t.k) ? '' : isOne(-t.k) ? '-' : `${tex(t.k)}\\,`;
  const v = isZero(t.v) ? '' : t.v > 0 ? ` + ${tex(t.v)}` : ` - ${tex(-t.v)}`;
  const body = `${k}${core}${v}`;
  return t.abs ? `\\left|${body}\\right|` : body;
}

export interface Quadratic {
  a: number;
  b: number;
  c: number;
  delta: number;
  roots: number[];
  vertex: [number, number];
}

export function quadraticOf(p: ParamState): Quadratic {
  const a = num(p, 'qa');
  const b = num(p, 'qb');
  const c = num(p, 'qc');
  const delta = b * b - 4 * a * c;
  let roots: number[] = [];
  if (isZero(a)) roots = isZero(b) ? [] : [-c / b];
  else if (delta > 1e-12) roots = [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)].sort((x, y) => x - y);
  else if (Math.abs(delta) <= 1e-12) roots = [-b / (2 * a)];
  const vx = isZero(a) ? NaN : -b / (2 * a);
  return { a, b, c, delta, roots, vertex: [vx, a * vx * vx + b * vx + c] };
}

export function quadraticTex({ a, b, c }: Quadratic): string {
  const terms: string[] = [];
  if (!isZero(a)) terms.push(isOne(a) ? 'x^2' : isOne(-a) ? '-x^2' : `${tex(a)}x^2`);
  if (!isZero(b)) {
    const mag = Math.abs(b);
    const t = isOne(mag) ? 'x' : `${tex(mag)}x`;
    terms.push(terms.length ? (b > 0 ? `+ ${t}` : `- ${t}`) : b > 0 ? t : `-${t}`);
  }
  if (!isZero(c) || !terms.length) terms.push(terms.length ? (c > 0 ? `+ ${tex(c)}` : `- ${tex(-c)}`) : tex(c));
  return terms.join(' ');
}
