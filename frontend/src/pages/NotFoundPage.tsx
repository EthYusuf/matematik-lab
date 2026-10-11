import { Link } from 'react-router';
import { Glyph } from '../core/ui/Glyph';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Glyph fn={(x) => (Math.abs(x) < 0.08 ? NaN : 0.25 / x)} className="mx-auto h-24 w-60" color="var(--c-hot)" />
      <h1 className="mt-6 font-display text-[56px] leading-none text-ink">Tanımsız</h1>
      <p className="mt-4 text-[16px] text-ink-2">Bu sayfa, 1/x'in x = 0 noktası gibi: burada hiçbir şey yok.</p>
      <Link to="/" className="btn-primary mt-8">
        ← Ana sayfaya dön
      </Link>
    </div>
  );
}
