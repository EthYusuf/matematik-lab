import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('aynı tohumla aynı diziyi üretir', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('[0,1) aralığında ve yaklaşık düzgün dağılır', () => {
    const rng = createRng(7);
    const n = 100_000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / n).toBeCloseTo(0.5, 2);
  });
});
