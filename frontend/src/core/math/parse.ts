/**
 * Öğrencinin yazdığı sayısal cevabı ayrıştırır.
 * Kabul edilenler: "2", "-1,5", "3.14", "π", "pi", "-π/2", "2π", "3π/4", "1/2".
 * eval kullanılmaz; tanınmayan girdi için null döner.
 */
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/pi/g, 'π').replace(/[−–]/g, '-').replace(/,/g, '.');
  if (!s) return null;

  const piMatch = /^(-?)(\d*\.?\d*)π(?:\/(\d*\.?\d+))?$/.exec(s);
  if (piMatch) {
    const [, sign, coef, den] = piMatch;
    const c = coef === '' ? 1 : Number(coef);
    const d = den === undefined ? 1 : Number(den);
    if (!Number.isFinite(c) || !Number.isFinite(d) || d === 0) return null;
    return (sign === '-' ? -1 : 1) * ((c * Math.PI) / d);
  }

  const fracMatch = /^(-?\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s);
  if (fracMatch) {
    const d = Number(fracMatch[2]);
    return d === 0 ? null : Number(fracMatch[1]) / d;
  }

  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}
