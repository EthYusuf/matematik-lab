import { num, type ParamState } from '../../core/types';

export type V = [number, number];

export const vecsOf = (p: ParamState): { u: V; v: V } => ({ u: [num(p, 'ux'), num(p, 'uy')], v: [num(p, 'vx'), num(p, 'vy')] });

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
export const norm = (a: V) => Math.hypot(a[0], a[1]);
/** 2B vektörel çarpımın z bileşeni: paralelkenarın işaretli alanı. */
export const cross = (a: V, b: V) => a[0] * b[1] - a[1] * b[0];

/** u ile v arasındaki açı (radyan, 0…π). */
export function angle(a: V, b: V): number {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : Math.acos(Math.max(-1, Math.min(1, dot(a, b) / n)));
}

/** v'nin u üzerindeki izdüşüm vektörü. */
export function project(v: V, u: V): V {
  const uu = dot(u, u);
  if (uu === 0) return [0, 0];
  const k = dot(u, v) / uu;
  return [k * u[0], k * u[1]];
}
