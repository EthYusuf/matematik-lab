import { describe, expect, it } from 'vitest';
import { binomialPmf, binsMeanSd, diceExpected, diceRun, galtonRun, montyRun } from './model';

describe('kuramsal dağılımlar', () => {
  it('iki zar toplamı olasılıkları 1 eder ve 7 en olasıdır', () => {
    expect(diceExpected.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(diceExpected[5]).toBeCloseTo(1 / 6, 12);
  });

  it('binom dağılımı 1 eder; ortalama np', () => {
    const pmf = binomialPmf(10, 0.3);
    expect(pmf.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(pmf.reduce((s, q, k) => s + q * k, 0)).toBeCloseTo(3, 10);
  });
});

describe('Monte Carlo deneyleri (tohumlu, tekrarlanabilir)', () => {
  it('aynı tohum aynı sonucu verir', () => {
    expect(diceRun(5, 500).counts).toEqual(diceRun(5, 500).counts);
  });

  it('büyük sayılar yasası: 7 gelme sıklığı 1/6\'ya yaklaşır', () => {
    const r = diceRun(3, 20_000);
    expect(r.counts.reduce((a, b) => a + b, 0)).toBe(20_000);
    expect(r.counts[5] / 20_000).toBeCloseTo(1 / 6, 2);
  });

  it('Galton tahtası: ortalama ≈ np, standart sapma ≈ √(np(1−p))', () => {
    const { bins } = galtonRun(11, 20_000, 12, 0.5);
    const { mean, sd, total } = binsMeanSd(bins);
    expect(total).toBe(20_000);
    expect(mean).toBeCloseTo(6, 1);
    expect(sd).toBeCloseTo(Math.sqrt(3), 1);
  });

  it('Monty Hall: değiştirmek ≈ 2/3, kalmak ≈ 1/3 kazandırır', () => {
    expect(montyRun(1, 30_000, true).wins / 30_000).toBeCloseTo(2 / 3, 1);
    expect(montyRun(1, 30_000, false).wins / 30_000).toBeCloseTo(1 / 3, 1);
  });

  it('sunucu hiçbir zaman arabayı veya seçilen kapıyı açmaz', () => {
    for (let seed = 0; seed < 300; seed++) {
      const g = montyRun(seed, 1, seed % 2 === 0).last!;
      expect(g.opened).not.toBe(g.car);
      expect(g.opened).not.toBe(g.pick);
      expect(g.final).not.toBe(g.opened);
    }
  });
});
