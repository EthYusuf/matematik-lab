import type { vec } from 'mafs';
import type { RealFn } from '../../core/math/calculus';

export interface PresetFn {
  label: string;
  f: RealFn;
  /** Analitik türev: teğet eğimi sayısal yaklaşım değil, kesin değer olsun diye. */
  df: RealFn;
  tex: string;
  dtex: string;
  view: { x: vec.Vector2; y: vec.Vector2 };
  derivView: vec.Vector2;
}

export const FUNCTIONS = {
  square: {
    label: 'x²',
    f: (x) => x * x,
    df: (x) => 2 * x,
    tex: 'x^2',
    dtex: '2x',
    view: { x: [-3, 3], y: [-1, 6] },
    derivView: [-6, 6],
  },
  cubic: {
    label: 'x³ − 3x',
    f: (x) => x ** 3 - 3 * x,
    df: (x) => 3 * x * x - 3,
    tex: 'x^3 - 3x',
    dtex: '3x^2 - 3',
    view: { x: [-3, 3], y: [-4, 4] },
    derivView: [-4, 6],
  },
  sin: {
    label: 'sin x',
    f: Math.sin,
    df: Math.cos,
    tex: '\\sin x',
    dtex: '\\cos x',
    view: { x: [-3.5, 3.5], y: [-2, 2] },
    derivView: [-1.6, 1.6],
  },
  exp: {
    label: 'eˣ',
    f: Math.exp,
    df: Math.exp,
    tex: 'e^x',
    dtex: 'e^x',
    view: { x: [-3, 2.4], y: [-1, 7] },
    derivView: [-1, 7],
  },
} satisfies Record<string, PresetFn>;

export type FnKey = keyof typeof FUNCTIONS;

export const fnOf = (key: unknown): PresetFn => FUNCTIONS[(key as FnKey) in FUNCTIONS ? (key as FnKey) : 'square'];
