import { describe, expect, it } from 'vitest';
import { parseAnswer } from './parse';

describe('parseAnswer', () => {
  it('tam sayı ve ondalıkları okur (virgül veya nokta)', () => {
    expect(parseAnswer('2')).toBe(2);
    expect(parseAnswer(' -1,5 ')).toBe(-1.5);
    expect(parseAnswer('3.14')).toBe(3.14);
    expect(parseAnswer(',5')).toBe(0.5);
  });

  it('π ifadelerini okur', () => {
    expect(parseAnswer('π')).toBeCloseTo(Math.PI, 12);
    expect(parseAnswer('pi')).toBeCloseTo(Math.PI, 12);
    expect(parseAnswer('-π/2')).toBeCloseTo(-Math.PI / 2, 12);
    expect(parseAnswer('2π')).toBeCloseTo(2 * Math.PI, 12);
    expect(parseAnswer('3 π / 4')).toBeCloseTo((3 * Math.PI) / 4, 12);
    expect(parseAnswer('−π')).toBeCloseTo(-Math.PI, 12);
  });

  it('basit kesirleri okur', () => {
    expect(parseAnswer('1/2')).toBe(0.5);
    expect(parseAnswer('-3/4')).toBe(-0.75);
  });

  it('geçersiz girdiye null döner', () => {
    expect(parseAnswer('')).toBeNull();
    expect(parseAnswer('abc')).toBeNull();
    expect(parseAnswer('1/0')).toBeNull();
    expect(parseAnswer('2+2')).toBeNull();
    expect(parseAnswer('alert(1)')).toBeNull();
  });
});
