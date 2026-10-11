import { describe as suite, expect, it } from 'vitest';
import { describe, normalCdf, POPULATIONS, sampleMeans } from './model';

suite('merkezi limit teoremi', () => {
  it('ortalamaların standart sapması σ/√n olur', () => {
    for (const pop of Object.values(POPULATIONS)) {
      const n = 25;
      const s = describe(sampleMeans(pop, n, 6000, 3));
      expect(s.mean).toBeCloseTo(pop.mu, 1);
      expect(Math.abs(s.sd - pop.sigma / Math.sqrt(n)) / (pop.sigma / Math.sqrt(n))).toBeLessThan(0.05);
    }
  });

  it('çarpık nüfusta n büyüdükçe ortalamaların çarpıklığı azalır (≈ 2/√n)', () => {
    const skew1 = describe(sampleMeans(POPULATIONS.exponential, 1, 20000, 5)).skew;
    const skew40 = describe(sampleMeans(POPULATIONS.exponential, 40, 20000, 5)).skew;
    expect(skew1).toBeGreaterThan(1.6);
    expect(skew40).toBeLessThan(0.5);
  });

  it('normal dağılım fonksiyonu', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.96) - normalCdf(-1.96)).toBeCloseTo(0.95, 3);
  });
});
