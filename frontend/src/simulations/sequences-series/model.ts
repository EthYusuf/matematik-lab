import { num, str, type ParamState } from '../../core/types';

export type SeriesKey = 'geometric' | 'harmonic' | 'alternating' | 'basel';

export interface SeriesInfo {
  term: (k: number) => number; // k = 1, 2, 3, …
  limit: number | null; // ıraksaksa null
  tex: string;
  limitTex: string;
}

export function seriesOf(p: ParamState): SeriesInfo & { key: SeriesKey } {
  const key = str(p, 'series') as SeriesKey;
  const a = num(p, 'a');
  const r = num(p, 'r');
  switch (key) {
    case 'harmonic':
      return { key, term: (k) => 1 / k, limit: null, tex: '\\sum_{k=1}^{\\infty} \\frac{1}{k}', limitTex: '\\infty' };
    case 'alternating':
      return { key, term: (k) => (k % 2 ? 1 : -1) / k, limit: Math.LN2, tex: '\\sum_{k=1}^{\\infty} \\frac{(-1)^{k+1}}{k}', limitTex: '\\ln 2' };
    case 'basel':
      return { key, term: (k) => 1 / (k * k), limit: (Math.PI * Math.PI) / 6, tex: '\\sum_{k=1}^{\\infty} \\frac{1}{k^2}', limitTex: '\\frac{\\pi^2}{6}' };
    default:
      return {
        key: 'geometric',
        term: (k) => a * r ** (k - 1),
        limit: Math.abs(r) < 1 ? a / (1 - r) : null,
        tex: '\\sum_{k=1}^{\\infty} a\\,r^{k-1}',
        limitTex: Math.abs(r) < 1 ? '\\frac{a}{1-r}' : '\\text{ıraksak}',
      };
  }
}

export function partialSums(term: (k: number) => number, N: number): number[] {
  const out: number[] = [];
  let s = 0;
  for (let k = 1; k <= N; k++) {
    s += term(k);
    out.push(s);
  }
  return out;
}
