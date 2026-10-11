import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Glyph } from '../core/ui/Glyph';
import { mastery, useProgress } from '../features/progress/store';
import { CATALOG, TIERS, type Tier, type TopicEntry } from '../simulations/catalog';
import { HeroFigure } from './home/HeroFigure';

const METHOD = [
  { n: '01', title: 'Keşfet', body: 'Kısa bir anlatım ve serbest oyun alanı. Noktaları sürükle, kaydırıcıları oynat.' },
  { n: '02', title: 'Tahmin et', body: 'Simülasyon çalışmadan önce cevabını kilitle. Yanılmak, hatırlamanın en güçlü tetikleyicisidir.' },
  { n: '03', title: 'Gözlemle', body: 'Simülasyon sonucu canlı gösterir; tahminin ile gerçeği yan yana gör.' },
  { n: '04', title: 'Görevi çöz', body: 'Hedef bir durum verilir, parametrelerle sen kurarsın. Sistem otomatik doğrular.' },
];

export function HomePage() {
  const location = useLocation();
  const readyCount = CATALOG.filter((t) => t.load).length;

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0 });
  }, [location]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-8">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
        <div>
          <p className="eyebrow rise">Etkileşimli matematik laboratuvarı · Lise + Üniversite</p>
          <h1 className="rise mt-5 font-display text-[clamp(52px,7.2vw,104px)] leading-[0.92] tracking-[-0.01em] text-ink [animation-delay:80ms]">
            Matematiği <em className="text-hot">dokunarak</em> öğren.
          </h1>
          <p className="rise mt-6 max-w-[540px] text-[17px] leading-relaxed text-ink-2 [animation-delay:160ms]">
            Formülü ezberlemek yerine onu elinle çalıştır. Her konu bir simülasyon: önce tahmin et, sonra gözlemle,
            ardından görevi kendin kur. Yanlış tahminler bile kalıcı öğrenmeye dönüşür.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link to="/konu/trig-unit-circle" className="btn-primary !px-5 !py-3 !text-[15px]">
              Trigonometri ile başla →
            </Link>
            <Link to="/konu/derivative-tangent" className="btn-ghost !px-5 !py-3 !text-[15px]">
              Türev simülasyonu
            </Link>
          </div>
          <dl className="rise mt-10 flex flex-wrap gap-x-10 gap-y-4 [animation-delay:320ms]">
            {[
              [String(readyCount), 'etkileşimli simülasyon'],
              [String(readyCount * 3), 'otomatik doğrulanan görev'],
              ['∞', 'Python ile üretilen soru'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-[40px] leading-none text-ink">{v}</dd>
                <dd className="mt-1 text-[13px] text-ink-3">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="rise relative [animation-delay:200ms]">
          <div className="relative rotate-[0.6deg] rounded-xl border border-rule bg-elev p-4 shadow-[var(--shadow)] sm:p-6">
            <span aria-hidden className="absolute -top-3 left-10 h-6 w-24 -rotate-3 rounded-sm bg-pt/25 backdrop-blur-sm" />
            <span aria-hidden className="absolute -right-3 -bottom-3 h-6 w-20 rotate-[-38deg] rounded-sm bg-fn/20 backdrop-blur-sm" />
            <HeroFigure />
          </div>
          <figcaption className="mt-4 text-center font-display text-[17px] italic text-ink-3">
            y = sin θ — çemberle dalga aynı hareketin iki görüntüsüdür.
          </figcaption>
        </figure>
      </section>

      {/* Yöntem */}
      <section aria-labelledby="method-title" className="border-y border-rule py-10">
        <h2 id="method-title" className="sr-only">
          Öğrenme yöntemi
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {METHOD.map((m) => (
            <li key={m.n}>
              <p className="font-mono text-[12px] text-hot">{m.n}</p>
              <h3 className="mt-1 font-display text-[28px] leading-tight text-ink">{m.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Katalog */}
      <section id="konular" aria-labelledby="catalog-title" className="scroll-mt-20 pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="catalog-title" className="font-display text-[clamp(40px,5vw,64px)] leading-none text-ink">
            Konular
          </h2>
          <p className="max-w-md text-[14px] text-ink-2">
            Talebe göre sıralandı: YKS'deki ağırlık ve öğrencilerin en çok zorlandığı konular önce gelir.
          </p>
        </div>

        {([1, 2, 3, 4] as Tier[]).map((tier) => (
          <div key={tier} className="mt-12">
            <div className="mb-4 flex items-baseline gap-3 border-b border-rule pb-2">
              <h3 className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-ink">{TIERS[tier].title}</h3>
              <p className="text-[13px] text-ink-3">{TIERS[tier].note}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {CATALOG.filter((t) => t.tier === tier).map((t, i) => (
                <TopicCard key={t.id} topic={t} index={i} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function TopicCard({ topic, index }: { topic: TopicEntry; index: number }) {
  const progress = useProgress((s) => s.sims[topic.id]);
  const m = mastery(progress);
  const ready = Boolean(topic.load);

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-ink-3">{String(index + 1).padStart(2, '0')}</p>
          <h4 className="mt-0.5 font-display text-[27px] leading-[1.05] text-ink">{topic.title}</h4>
        </div>
        <Glyph fn={topic.glyph} className="h-12 w-[104px] shrink-0" color={ready ? 'var(--c-hot)' : 'var(--ink-3)'} />
      </div>
      <p className="mt-2 text-[14px] leading-snug text-ink-2">{topic.subtitle}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="flex gap-1.5">
          {topic.level.map((l) => (
            <span key={l} className="rounded border border-rule px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
              {l === 'lise' ? 'Lise' : 'Üniversite'}
            </span>
          ))}
        </div>
        {ready ? (
          m > 0 ? (
            <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-rule">
                <span className="block h-full rounded-full bg-tan" style={{ width: `${Math.round(m * 100)}%` }} />
              </span>
              %{Math.round(m * 100)}
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-ink transition-transform group-hover:translate-x-0.5">Başla →</span>
          )
        ) : (
          <span className="font-mono text-[11px] text-ink-3">Yakında</span>
        )}
      </div>
    </>
  );

  const base = 'flex h-full min-h-[184px] flex-col rounded-xl border p-5 transition-all';
  return (
    <li>
      {ready ? (
        <Link
          to={`/konu/${topic.id}`}
          className={`group ${base} border-rule-strong bg-elev shadow-[var(--shadow)] hover:-translate-y-0.5 hover:border-ink`}
        >
          {body}
        </Link>
      ) : (
        <div className={`${base} border-dashed border-rule bg-transparent opacity-70`} aria-disabled>
          {body}
        </div>
      )}
    </li>
  );
}
