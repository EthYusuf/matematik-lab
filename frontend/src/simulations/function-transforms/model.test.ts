import { describe, expect, it } from 'vitest';
import { BASES, quadraticOf, quadraticTex, transformed, transformTex, type Transform } from './model';

const id: Transform = { h: 0, v: 0, k: 1, m: 1, flipX: false, abs: false };

describe('dönüşümler', () => {
  it('f(x − h) + v grafiği h sağa, v yukarı kayar', () => {
    const g = transformed(BASES.square.f, { ...id, h: 2, v: -3 });
    expect(g(2)).toBe(-3); // tepe noktası (2, −3)
    expect(g(3)).toBe(-2);
  });

  it('k negatifken x eksenine göre yansır', () => {
    const g = transformed(BASES.square.f, { ...id, k: -2 });
    expect(g(1)).toBe(-2);
  });

  it('yatay ölçek ve y eksenine göre yansıma', () => {
    const g = transformed(BASES.sqrt.f, { ...id, m: 2, flipX: true });
    expect(g(-2)).toBeCloseTo(2, 12); // √(−2·−2) = 2
  });

  it('mutlak değer negatif kısmı yukarı katlar', () => {
    const g = transformed(BASES.square.f, { ...id, v: -4, abs: true });
    expect(g(0)).toBe(4);
  });

  it('okunur LaTeX üretir', () => {
    expect(transformTex('square', { ...id, h: 3, k: -2, v: 1 })).toBe('-2\\,(x - 3)^2 + 1');
    expect(transformTex('sin', { ...id, h: -1 })).toBe('\\sin(x + 1)');
    expect(transformTex('abs', id)).toBe('|x|');
  });
});

describe('ikinci dereceden fonksiyon', () => {
  it('kökler, diskriminant ve tepe noktası', () => {
    const q = quadraticOf({ qa: 1, qb: -4, qc: 3 });
    expect(q.delta).toBe(4);
    expect(q.roots).toEqual([1, 3]);
    expect(q.vertex).toEqual([2, -1]);
  });

  it('Δ = 0 iken tek (çift) kök, Δ < 0 iken gerçek kök yok', () => {
    expect(quadraticOf({ qa: 1, qb: 2, qc: 1 }).roots).toEqual([-1]);
    expect(quadraticOf({ qa: 1, qb: 0, qc: 1 }).roots).toEqual([]);
  });

  it('LaTeX biçimi', () => {
    expect(quadraticTex(quadraticOf({ qa: 2, qb: -8, qc: 6 }))).toBe('2x^2 - 8x + 6');
    expect(quadraticTex(quadraticOf({ qa: -1, qb: 1, qc: 0 }))).toBe('-x^2 + x');
  });
});
