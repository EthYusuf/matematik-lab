import { describe, expect, it } from 'vitest';
import { fmt, fmtPi, piFraction, tex, texPi } from './format';

describe('fmt', () => {
  it('Türkçe ondalık virgül kullanır', () => {
    expect(fmt(2.5)).toBe('2,5');
    expect(fmt(-0.125, 3)).toBe('−0,125');
    expect(fmt(1234.5)).toBe('1.234,5');
  });

  it('çok küçük negatifleri "−0" yerine 0 yazar', () => {
    expect(fmt(-0.0001)).toBe('0');
  });

  it('LaTeX için virgülü süslü parantezle korur', () => {
    expect(tex(2.5)).toBe('2{,}5');
    expect(tex(-1234.5)).toBe('-1234{,}5');
  });
});

describe('π gösterimi', () => {
  it('π katlarını sadeleştirir', () => {
    expect(piFraction(Math.PI / 2)).toEqual({ num: 1, den: 2 });
    expect(piFraction((6 * Math.PI) / 4)).toEqual({ num: 3, den: 2 });
    expect(piFraction(1)).toBeNull();
  });

  it('okunur metin üretir', () => {
    expect(fmtPi(Math.PI)).toBe('π');
    expect(fmtPi(-Math.PI / 3)).toBe('−π/3');
    expect(fmtPi(2 * Math.PI)).toBe('2π');
    expect(fmtPi(0)).toBe('0');
    expect(fmtPi(0.7)).toBe('0,7');
  });

  it('LaTeX kesir üretir', () => {
    expect(texPi((3 * Math.PI) / 4)).toBe('\\frac{3\\pi}{4}');
  });
});
