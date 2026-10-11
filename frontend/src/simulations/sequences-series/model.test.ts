import { describe, expect, it } from 'vitest';
import { partialSums, seriesOf } from './model';

const S = (p: Record<string, number | string>, N: number) => {
  const s = seriesOf(p);
  return partialSums(s.term, N)[N - 1];
};

describe('seriler', () => {
  it('geometrik seri a/(1−r) değerine yakınsar', () => {
    expect(S({ series: 'geometric', a: 1, r: 0.5 }, 60)).toBeCloseTo(2, 12);
    expect(seriesOf({ series: 'geometric', a: 1.5, r: 0.5 }).limit).toBe(3);
    expect(seriesOf({ series: 'geometric', a: 1, r: 1.1 }).limit).toBeNull();
  });

  it('harmonik seri yavaşça büyür: H₃₁ > 4 > H₃₀', () => {
    expect(S({ series: 'harmonic' }, 31)).toBeGreaterThan(4);
    expect(S({ series: 'harmonic' }, 30)).toBeLessThan(4);
  });

  it('alterne harmonik ln 2\'ye, Basel π²/6\'ya yaklaşır', () => {
    expect(Math.abs(S({ series: 'alternating' }, 100) - Math.LN2)).toBeLessThan(0.01);
    expect(S({ series: 'basel' }, 10000)).toBeCloseTo((Math.PI * Math.PI) / 6, 3);
  });
});
