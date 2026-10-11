import { describe, expect, it } from 'vitest';
import { compound, modelOf } from './model';

describe('üstel büyüme ve bozunma', () => {
  it('bileşik faiz sıklık arttıkça e\'ye yaklaşır', () => {
    const yearly = compound(1, 1, 1, 1);
    const daily = compound(1, 1, 365, 1);
    const cont = compound(1, 1, Infinity, 1);
    expect(yearly).toBe(2);
    expect(daily).toBeGreaterThan(2.71);
    expect(daily).toBeLessThan(Math.E);
    expect(cont).toBeCloseTo(Math.E, 12);
  });

  it('yarı ömür: 3 yarı ömürde 1/8 kalır', () => {
    const m = modelOf({ model: 'decay', P: 800, T: 5, r: 0, comp: '1' });
    expect(m.f(15)).toBeCloseTo(100, 10);
  });

  it('72 kuralı: %7,2 ile yaklaşık 10 yılda ikiye katlanır', () => {
    const m = modelOf({ model: 'interest', P: 1000, r: 0.072, comp: '1', T: 5 });
    expect(m.characteristic).toBeCloseTo(9.97, 1);
  });
});
