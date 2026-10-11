import { describe, expect, it } from 'vitest';
import { numericDerivative, riemannSum, secantSlope } from './calculus';

const square = (x: number) => x * x;

describe('secantSlope', () => {
  it('x² için kesen eğimi tam olarak 2x + h olur', () => {
    expect(secantSlope(square, 1, 0.5)).toBeCloseTo(2.5, 12);
    expect(secantSlope(square, -2, 0.1)).toBeCloseTo(-3.9, 12);
  });

  it('h küçüldükçe teğet eğimine yaklaşır', () => {
    const errors = [1, 0.1, 0.01, 0.001].map((h) => Math.abs(secantSlope(Math.sin, 0.7, h) - Math.cos(0.7)));
    for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThan(errors[i - 1]);
  });
});

describe('numericDerivative', () => {
  it('sin x için cos x verir', () => {
    for (const x of [-2, 0, 0.5, 3]) expect(numericDerivative(Math.sin, x)).toBeCloseTo(Math.cos(x), 8);
  });
});

describe('riemannSum', () => {
  it('[0,1] aralığında x² için n büyüdükçe 1/3 değerine yakınsar', () => {
    const n = 10_000;
    // Kapalı formüller: sağ = 1/3 + 1/(2n) + 1/(6n²), sol = 1/3 − 1/(2n) + 1/(6n²)
    expect(riemannSum(square, 0, 1, n, 'right')).toBeCloseTo(1 / 3 + 1 / (2 * n) + 1 / (6 * n * n), 12);
    expect(riemannSum(square, 0, 1, n, 'left')).toBeCloseTo(1 / 3 - 1 / (2 * n) + 1 / (6 * n * n), 12);
    expect(riemannSum(square, 0, 1, n, 'mid')).toBeCloseTo(1 / 3, 8);
    expect(riemannSum(square, 0, 1, n, 'trapezoid')).toBeCloseTo(1 / 3, 8);
  });

  it('artan fonksiyonda sol toplam alttan, sağ toplam üstten yaklaşır', () => {
    expect(riemannSum(square, 0, 1, 10, 'left')).toBeLessThan(1 / 3);
    expect(riemannSum(square, 0, 1, 10, 'right')).toBeGreaterThan(1 / 3);
  });

  it('doğrusal fonksiyonda yamuk kuralı tamdır', () => {
    expect(riemannSum((x) => 3 * x + 1, 0, 2, 3, 'trapezoid')).toBeCloseTo(8, 12);
  });
});
