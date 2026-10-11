const trFormatters = new Map<number, Intl.NumberFormat>();

function formatter(digits: number): Intl.NumberFormat {
  let f = trFormatters.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
    trFormatters.set(digits, f);
  }
  return f;
}

/** Türkçe ondalık gösterim: 2.5 → "2,5". */
export function fmt(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'tanımsız';
  const s = formatter(digits).format(Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v);
  return s.replace('-', '−');
}

/** LaTeX içinde virgülün boşluk eklememesi için {,} kullanılır. */
export function tex(v: number, digits = 2): string {
  return fmt(v, digits).replace(/\./g, '').replace(',', '{,}').replace('−', '-');
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Bir sayıyı π'nin kesirli katı olarak ifade etmeye çalışır (paydası ≤ 12).
 * Bulamazsa null döner.
 */
export function piFraction(v: number): { num: number; den: number } | null {
  const ratio = v / Math.PI;
  for (let den = 1; den <= 12; den++) {
    const n = Math.round(ratio * den);
    if (Math.abs(ratio * den - n) < 1e-6) {
      const g = gcd(Math.abs(n), den) || 1;
      return { num: n / g, den: den / g };
    }
  }
  return null;
}

/** 1.5707… → "π/2", 3.1415… → "π", 0.7 → "0,7". */
export function fmtPi(v: number, digits = 2): string {
  const f = piFraction(v);
  if (!f) return fmt(v, digits);
  if (f.num === 0) return '0';
  const sign = f.num < 0 ? '−' : '';
  const n = Math.abs(f.num);
  const head = n === 1 ? 'π' : `${n}π`;
  return f.den === 1 ? `${sign}${head}` : `${sign}${head}/${f.den}`;
}

/** fmtPi'nin LaTeX sürümü: \frac{\pi}{2}. */
export function texPi(v: number, digits = 2): string {
  const f = piFraction(v);
  if (!f) return tex(v, digits);
  if (f.num === 0) return '0';
  const sign = f.num < 0 ? '-' : '';
  const n = Math.abs(f.num);
  const head = n === 1 ? '\\pi' : `${n}\\pi`;
  return f.den === 1 ? `${sign}${head}` : `${sign}\\frac{${head}}{${f.den}}`;
}

export const toDegrees = (rad: number) => (rad * 180) / Math.PI;

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** 10 üzeri gösterim: pow10(-2) → "10⁻²" (log ölçekli eksenler için). */
export const pow10 = (exp: number) => `10${String(Math.round(exp)).replace(/[-0-9]/g, (c) => SUP[c])}`;
