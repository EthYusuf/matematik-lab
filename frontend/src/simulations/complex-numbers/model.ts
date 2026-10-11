import { fmt } from '../../core/math/format';
import { num, type ParamState } from '../../core/types';

export type Cx = [number, number];

export const zOf = (p: ParamState): { z1: Cx; z2: Cx } => ({ z1: [num(p, 'ar'), num(p, 'ai')], z2: [num(p, 'br'), num(p, 'bi')] });

export const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
export const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const cabs = (a: Cx) => Math.hypot(a[0], a[1]);
export const carg = (a: Cx) => Math.atan2(a[1], a[0]);
export const fromPolar = (r: number, t: number): Cx => [r * Math.cos(t), r * Math.sin(t)];

export function cpow(z: Cx, n: number): Cx {
  return fromPolar(cabs(z) ** n, carg(z) * n);
}

/** zⁿ = w denkleminin n kökü (De Moivre). */
export function roots(w: Cx, n: number): Cx[] {
  const r = cabs(w) ** (1 / n);
  const t = carg(w);
  return Array.from({ length: n }, (_, k) => fromPolar(r, (t + 2 * Math.PI * k) / n));
}

export function cstr([re, im]: Cx, digits = 2): string {
  const r = Math.abs(re) < 1e-9 ? 0 : re;
  const i = Math.abs(im) < 1e-9 ? 0 : im;
  if (i === 0) return fmt(r, digits);
  const imag = Math.abs(i) === 1 ? 'i' : `${fmt(Math.abs(i), digits)}i`;
  if (r === 0) return i < 0 ? `−${imag}` : imag;
  return `${fmt(r, digits)} ${i < 0 ? '−' : '+'} ${imag}`;
}

export const deg = (rad: number) => (rad * 180) / Math.PI;
