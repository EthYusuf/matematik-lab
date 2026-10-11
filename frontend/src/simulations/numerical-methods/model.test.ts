import { describe, expect, it } from 'vitest';
import { bisection, newton, PROBLEMS, trueRoot } from './model';

describe('kök bulma', () => {
  it('referans kökler doğru', () => {
    expect(trueRoot(PROBLEMS.sqrt2)).toBeCloseTo(Math.SQRT2, 14);
    expect(trueRoot(PROBLEMS.exp3)).toBeCloseTo(Math.log(3), 14);
    expect(trueRoot(PROBLEMS.cosx)).toBeCloseTo(0.7390851332, 9);
  });

  it('Newton karesel yakınsar: √2 için 4 adımda 10⁻⁶ altı', () => {
    const xs = newton(PROBLEMS.sqrt2, 1, 4);
    expect(xs[1]).toBe(1.5);
    expect(Math.abs(xs[4] - Math.SQRT2)).toBeLessThan(1e-6);
  });

  it('ikiye bölmede her adımda aralık yarıya iner', () => {
    const b = bisection(PROBLEMS.cosx, 10);
    expect(b[10][1] - b[10][0]).toBeCloseTo(1 / 1024, 12);
    const r = trueRoot(PROBLEMS.cosx);
    b.forEach(([lo, hi]) => {
      expect(lo).toBeLessThanOrEqual(r);
      expect(hi).toBeGreaterThanOrEqual(r);
    });
  });

  it('kötü başlangıç Newton\'u yavaşlatır (görev 2 çözülebilir)', () => {
    const r = trueRoot(PROBLEMS.cubic);
    const xs = newton(PROBLEMS.cubic, 0.8, 6);
    expect(Math.abs(xs[6] - r)).toBeGreaterThan(0.1);
  });
});
