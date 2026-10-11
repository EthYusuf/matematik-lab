import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Glyph } from '../core/ui/Glyph';
import { api } from '../features/api/client';
import { useAuth, type User } from '../features/auth/store';
import { mastery, useProgress } from '../features/progress/store';
import { QuizPanel } from '../features/quiz/QuizPanel';
import { CATALOG, TIERS, findTopic, type Tier } from '../simulations/catalog';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  awarded_at: string | null;
}

interface Summary {
  user: User;
  mastery: Record<string, number>;
  stats: Record<string, number>;
  badges: Badge[];
  review_due: number;
}

interface ReviewItem {
  topic: string;
  due_at: string;
  interval_days: number;
  repetitions: number;
  ease: number;
  due: boolean;
}

const pct = (v: number) => `%${Math.round(v * 100)}`;

export function DashboardPage() {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const local = useProgress((s) => s.sims);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    api<Summary>('/me/summary').then(setSummary).catch(() => undefined);
  }, [status, local]);

  const masteryOf = (id: string) => summary?.mastery[id] ?? mastery(local[id]);
  const overall = CATALOG.filter((t) => t.load).reduce((s, t) => s + masteryOf(t.id), 0) / Math.max(1, CATALOG.filter((t) => t.load).length);
  const localStats = Object.values(local).reduce(
    (s, p) => ({
      steps_done: s.steps_done + p.completedSteps.length,
      challenges_solved: s.challenges_solved + p.solvedChallenges.length,
      predictions_right: s.predictions_right + Object.values(p.predictions).filter(Boolean).length,
      predictions_wrong: s.predictions_wrong + Object.values(p.predictions).filter((v) => !v).length,
    }),
    { steps_done: 0, challenges_solved: 0, predictions_right: 0, predictions_wrong: 0 },
  );
  const stats: Record<string, number> = { ...localStats, ...(summary?.stats ?? {}) };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Panelim</p>
          <h1 className="mt-2 font-display text-[clamp(44px,6vw,80px)] leading-[0.95] text-ink">
            {user ? (
              <>
                Merhaba, <em className="text-hot">{user.display_name}</em>
              </>
            ) : (
              'İlerlemen'
            )}
          </h1>
          {!user && (
            <p className="mt-3 max-w-xl text-[15px] text-ink-2">
              Şu an ilerlemen yalnızca bu tarayıcıda.{' '}
              <Link to="/kayit" className="font-semibold text-ink underline decoration-hot decoration-2 underline-offset-2">
                Ücretsiz hesap aç
              </Link>{' '}
              ve rozetler, aralıklı tekrar ve cihazlar arası senkron kazan.
            </p>
          )}
        </div>
        <MasteryRing value={overall} />
      </header>

      <section aria-labelledby="stats" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <h2 id="stats" className="sr-only">
          İstatistikler
        </h2>
        {[
          ['Ders adımı', stats.steps_done],
          ['Doğru tahmin', stats.predictions_right],
          ['Öğretici yanılgı', stats.predictions_wrong],
          ['Çözülen görev', stats.challenges_solved],
          ['Doğru quiz', summary ? `${stats.quiz_correct ?? 0}/${stats.quiz_total ?? 0}` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-rule bg-elev p-4 shadow-[var(--shadow)]">
            <p className="font-display text-[40px] leading-none text-ink">{value}</p>
            <p className="mt-1 text-[13px] text-ink-3">{label}</p>
          </div>
        ))}
      </section>

      {summary && (
        <section aria-labelledby="review-cta" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink bg-sunk px-5 py-4">
          <div>
            <h2 id="review-cta" className="font-display text-[26px] leading-tight text-ink">
              {summary.review_due > 0 ? `${summary.review_due} konu tekrar bekliyor` : 'Tekrar listen güncel'}
            </h2>
            <p className="text-[13px] text-ink-2">Aralıklı tekrar (SM-2): doğru bildiğin konular giderek seyrek, zorlandıkların sık sorulur.</p>
          </div>
          <Link to="/tekrar" className="btn-primary !px-5 !py-3">
            Tekrara başla →
          </Link>
        </section>
      )}

      <section aria-labelledby="map" className="mt-12">
        <h2 id="map" className="font-display text-[36px] leading-none text-ink">
          Ustalık haritası
        </h2>
        {([1, 2, 3, 4] as Tier[]).map((tier) => (
          <div key={tier} className="mt-6">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">{TIERS[tier].title}</p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {CATALOG.filter((t) => t.tier === tier).map((t) => {
                const m = masteryOf(t.id);
                return (
                  <li key={t.id}>
                    <Link
                      to={`/konu/${t.id}`}
                      className="group flex h-full flex-col rounded-xl border border-rule bg-elev p-3 transition-colors hover:border-ink"
                      style={{ background: m > 0 ? `color-mix(in srgb, var(--c-tan) ${Math.round(m * 22)}%, var(--bg-elev))` : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-[19px] leading-tight text-ink">{t.title}</p>
                        <Glyph fn={t.glyph} className="h-7 w-14 shrink-0" color={m > 0 ? 'var(--c-tan)' : 'var(--ink-3)'} />
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-3">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-rule">
                          <span className="block h-full rounded-full bg-tan" style={{ width: `${Math.round(m * 100)}%` }} />
                        </span>
                        <span className="font-mono text-[11px] text-ink-2">{pct(m)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {summary && (
        <section aria-labelledby="badges" className="mt-12">
          <h2 id="badges" className="font-display text-[36px] leading-none text-ink">
            Rozetler <span className="font-mono text-[14px] text-ink-3">{summary.badges.filter((b) => b.earned).length}/{summary.badges.length}</span>
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.badges.map((b) => (
              <li key={b.id} className={`flex items-start gap-3 rounded-xl border p-4 ${b.earned ? 'border-ink bg-elev shadow-[var(--shadow)]' : 'border-dashed border-rule opacity-60'}`}>
                <span className={`text-3xl leading-none ${b.earned ? '' : 'grayscale'}`} aria-hidden>
                  {b.icon}
                </span>
                <div>
                  <p className="font-semibold text-ink">{b.title}</p>
                  <p className="text-[13px] text-ink-2">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {user && <DangerZone />}
    </div>
  );
}

function MasteryRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36" role="img" aria-label={`Genel ustalık ${pct(value)}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--rule)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--c-tan)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[36px] leading-none text-ink">{pct(value)}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">ustalık</span>
      </div>
    </div>
  );
}

function DangerZone() {
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const clear = useProgress((s) => s.clear);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <section aria-labelledby="danger" className="mt-16 rounded-xl border border-bad/40 p-5">
      <h2 id="danger" className="font-display text-[24px] text-ink">
        Hesabımı sil
      </h2>
      <p className="mt-1 text-[14px] text-ink-2">Hesabın ve tüm öğrenme verilerin kalıcı olarak silinir (KVKK). Bu işlem geri alınamaz.</p>
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="btn-ghost mt-3 !border-bad/50 !text-bad">
          Hesabımı sil…
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await deleteAccount();
              clear();
              navigate('/');
            }}
            className="btn-primary !border-bad !bg-bad"
          >
            Evet, kalıcı olarak sil
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="btn-ghost">
            Vazgeç
          </button>
        </div>
      )}
    </section>
  );
}

export function ReviewPage() {
  const status = useAuth((s) => s.status);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const load = useCallback(() => {
    api<ReviewItem[]>('/me/review')
      .then((list) => {
        setItems(list);
        setActive((cur) => cur ?? list.find((i) => i.due)?.topic ?? null);
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  if (status === 'anonymous') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-[52px] leading-none text-ink">Aralıklı tekrar</h1>
        <p className="mt-4 text-[16px] text-ink-2">Tekrar listesi hesabında tutulur. Giriş yap; quizlerde cevapladığın konular doğru zamanda yeniden sorulsun.</p>
        <Link to="/giris" className="btn-primary mt-8">
          Giriş yap
        </Link>
      </div>
    );
  }

  const due = items?.filter((i) => i.due) ?? [];
  const later = items?.filter((i) => !i.due) ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8">
      <p className="eyebrow">SM-2 aralıklı tekrar</p>
      <h1 className="mt-2 font-display text-[clamp(44px,6vw,76px)] leading-[0.95] text-ink">Tekrar zamanı</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-2">
        Unutma eğrisini yenmenin yolu: bir bilgiyi tam unutmak üzereyken hatırlamak. Doğru cevap verdiğin konular 1 → 3 → 8 → 20 gün arayla, yanlış
        verdiklerin ertesi gün yeniden gelir.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {active ? (
            <QuizPanel
              key={active}
              topic={active}
              review
              title={`Tekrar · ${findTopic(active)?.title ?? active}`}
              onAnswered={() => setTimeout(load, 300)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-rule-strong p-8 text-center">
              <p className="font-display text-[28px] text-ink">{items === null ? 'Yükleniyor…' : 'Bugünlük bu kadar!'}</p>
              <p className="mt-2 text-[14px] text-ink-2">
                {items?.length ? 'Sıradaki tekrarlar sağda.' : 'Konu sayfalarındaki pekiştirme sorularını cevapladıkça liste dolar.'}
              </p>
            </div>
          )}
        </div>
        <aside className="space-y-5">
          <div>
            <p className="eyebrow mb-2">Bekleyen ({due.length})</p>
            <ul className="space-y-1.5">
              {due.map((i) => (
                <li key={i.topic}>
                  <button
                    type="button"
                    onClick={() => setActive(i.topic)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[14px] ${active === i.topic ? 'border-ink bg-sunk' : 'border-rule bg-elev hover:border-ink-3'}`}
                  >
                    <span className="text-ink">{findTopic(i.topic)?.title ?? i.topic}</span>
                    <span className="font-mono text-[11px] text-hot">şimdi</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-2">Sonra ({later.length})</p>
            <ul className="space-y-1.5">
              {later.map((i) => (
                <li key={i.topic} className="flex items-center justify-between rounded-lg border border-rule px-3 py-2 text-[14px]">
                  <span className="text-ink-2">{findTopic(i.topic)?.title ?? i.topic}</span>
                  <span className="font-mono text-[11px] text-ink-3">{new Date(i.due_at + 'Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
