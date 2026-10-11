import { describe, expect, it } from 'vitest';
import { cabs, carg, cmul, cpow, cstr, roots } from './model';

describe('karmaşık sayılar', () => {
  it('i ile çarpmak 90° döndürür', () => {
    expect(cmul([3, 1], [0, 1])).toEqual([-1, 3]);
  });

  it('çarpımda modüller çarpılır, argümanlar toplanır', () => {
    const a: [number, number] = [1, 1];
    const b: [number, number] = [0, 2];
    const p = cmul(a, b);
    expect(cabs(p)).toBeCloseTo(cabs(a) * cabs(b), 12);
    expect(carg(p)).toBeCloseTo(carg(a) + carg(b), 12);
  });

  it('De Moivre: (1 + i)⁴ = −4', () => {
    const z = cpow([1, 1], 4);
    expect(z[0]).toBeCloseTo(-4, 10);
    expect(z[1]).toBeCloseTo(0, 10);
  });

  it('zⁿ = 1\'in kökleri birim çemberde eşit aralıklıdır', () => {
    const r = roots([1, 0], 6);
    expect(r).toHaveLength(6);
    r.forEach((z) => {
      expect(cabs(z)).toBeCloseTo(1, 12);
      const back = cpow(z, 6);
      expect(back[0]).toBeCloseTo(1, 10);
      expect(back[1]).toBeCloseTo(0, 10);
    });
  });

  it('Türkçe biçim', () => {
    expect(cstr([3, -4])).toBe('3 − 4i');
    expect(cstr([0, 1])).toBe('i');
    expect(cstr([2.5, 0])).toBe('2,5');
  });
});
