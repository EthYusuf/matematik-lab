import { describe, expect, it } from 'vitest';
import { partialSum, rmsError, WAVES } from './model';

describe('Fourier serileri', () => {
  it('kare dalgada çift harmonikler sıfırdır', () => {
    expect(WAVES.square.b(2)).toBe(0);
    expect(WAVES.square.b(3) / WAVES.square.b(1)).toBeCloseTo(1 / 3, 12);
  });

  it('harmonik ekledikçe RMS hata azalır', () => {
    const errs = [1, 5, 19, 49].map((N) => rmsError(WAVES.square, N));
    for (let i = 1; i < errs.length; i++) expect(errs[i]).toBeLessThan(errs[i - 1]);
  });

  it('Gibbs olayı: sıçrama yüksekliğinin ~%9 kadarı taşar (±1 dalgada tepe ≈ 1,179)', () => {
    const f = partialSum(WAVES.square, 99);
    let max = 0;
    for (let i = 1; i < 4000; i++) max = Math.max(max, f((i / 4000) * 0.3));
    expect(max).toBeGreaterThan(1.17);
    expect(max).toBeLessThan(1.19);
  });

  it('görev eşikleri: kare N = 19 < 0,15; üçgen N = 3 < 0,05 ama N = 1 değil', () => {
    expect(rmsError(WAVES.square, 19)).toBeLessThan(0.15);
    expect(rmsError(WAVES.square, 15)).toBeGreaterThan(0.15);
    expect(rmsError(WAVES.triangle, 3)).toBeLessThan(0.05);
    expect(rmsError(WAVES.triangle, 1)).toBeGreaterThan(0.05);
    expect(rmsError(WAVES.sawtooth, 30)).toBeLessThan(0.1);
  });
});
