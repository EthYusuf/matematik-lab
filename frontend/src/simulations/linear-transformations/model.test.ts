import { describe, expect, it } from 'vitest';
import { apply, det, eigen } from './model';

describe('2×2 matris', () => {
  it('sütunlar î ve ĵ\'nin görüntüleridir', () => {
    const m = { a: 2, b: -1, c: 3, d: 4 };
    expect(apply(m, [1, 0])).toEqual([2, 3]);
    expect(apply(m, [0, 1])).toEqual([-1, 4]);
  });

  it('determinant alan çarpanıdır', () => {
    expect(det({ a: 2, b: 0, c: 0, d: 3 })).toBe(6);
    expect(det({ a: 0, b: -1, c: 1, d: 0 })).toBe(1); // döndürme alanı korur
    expect(det({ a: 1, b: 2, c: 0.5, d: 1 })).toBe(0); // tekil
  });

  it('özvektörler yalnızca ölçeklenir: A·v = λ·v', () => {
    const m = { a: 2, b: 1, c: 1, d: 2 };
    const e = eigen(m);
    expect(e.real).toBe(true);
    expect(e.values).toEqual([3, 1]);
    e.vectors.forEach((v, i) => {
      const av = apply(m, v);
      expect(av[0]).toBeCloseTo(e.values[i] * v[0], 10);
      expect(av[1]).toBeCloseTo(e.values[i] * v[1], 10);
    });
  });

  it('döndürmenin gerçek özdeğeri yoktur', () => {
    const e = eigen({ a: 0, b: -1, c: 1, d: 0 });
    expect(e.real).toBe(false);
    expect(e.complex).toEqual({ re: 0, im: 1 });
  });
});
