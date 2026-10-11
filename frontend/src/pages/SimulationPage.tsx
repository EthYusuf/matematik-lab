import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ParamPanel } from '../core/controls/ParamPanel';
import { ChallengePanel } from '../core/lesson/ChallengePanel';
import { LessonPanel } from '../core/lesson/LessonPanel';
import { useSimController } from '../core/lesson/useSimController';
import type { SimulationModule } from '../core/types';
import { Tex } from '../core/ui/Tex';
import { mastery, useProgress } from '../features/progress/store';
import { QuizPanel } from '../features/quiz/QuizPanel';
import { StepSolver } from '../features/solver/StepSolver';
import { findTopic, loadTopic, TIERS, type TopicEntry } from '../simulations/catalog';
import { NotFoundPage } from './NotFoundPage';

export function SimulationPage() {
  const { simId } = useParams();
  const entry = findTopic(simId);
  const [loaded, setLoaded] = useState<{ id: string; module: SimulationModule } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setFailed(false);
    if (!entry) return;
    const p = loadTopic(entry);
    if (!p) return;
    let alive = true;
    p.then((module) => alive && setLoaded({ id: entry.id, module })).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [entry]);

  if (!entry) return <NotFoundPage />;
  if (!entry.load) return <ComingSoon entry={entry} />;
  if (failed)
    return (
      <Centered title="Simülasyon yüklenemedi">
        Bağlantını kontrol edip sayfayı yenile.
      </Centered>
    );
  if (!loaded || loaded.id !== entry.id) return <WorkspaceSkeleton entry={entry} />;
  return <Workspace key={entry.id} entry={entry} module={loaded.module} />;
}

function Workspace({ entry, module }: { entry: TopicEntry; module: SimulationModule }) {
  const ctl = useSimController(module);
  const registerTotals = useProgress((s) => s.registerTotals);
  const progress = useProgress((s) => s.sims[module.id]);
  const m = mastery(progress);
  const Sim = module.Component;

  useEffect(() => {
    registerTotals(module.id, module.lesson.length, module.challenges.length);
  }, [module, registerTotals]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-8">
      <WorkspaceHeader entry={entry} mastery={m} />

      <div className="workspace">
        <div className="[grid-area:stage] min-w-0">
          <section aria-label="Simülasyon" className="overflow-hidden rounded-xl border border-rule-strong bg-elev shadow-[var(--shadow)]">
            <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
              <p className="eyebrow">Simülasyon</p>
              <button type="button" onClick={ctl.reset} className="text-[12px] font-medium text-ink-3 hover:text-ink">
                ↺ Sıfırla
              </button>
            </div>
            <Sim params={ctl.params} setParams={ctl.setParams} animate={ctl.animate} />
          </section>
        </div>

        <aside className="[grid-area:aside] min-w-0 space-y-4 xl:sticky xl:top-20 xl:self-start">
          <section aria-label="Canlı formül" className="rounded-xl border border-rule bg-elev p-4 shadow-[var(--shadow)]">
            <p className="eyebrow mb-2">Canlı formül</p>
            <Tex block math={module.formula(ctl.params)} className="text-[14px] text-ink" />
            <dl className="mt-4 divide-y divide-rule border-t border-rule">
              {module.readouts(ctl.params).map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 py-1.5">
                  <dt className="flex items-center gap-2 text-[13px] text-ink-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.tone ? `var(${r.tone})` : 'var(--rule-strong)' }} aria-hidden />
                    {r.label}
                  </dt>
                  <dd className="font-mono text-[13px] tabular-nums text-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-label="Parametreler" className="rounded-xl border border-rule bg-elev p-4 shadow-[var(--shadow)]">
            <p className="eyebrow mb-3">Parametreler</p>
            <ParamPanel schema={module.params} params={ctl.params} onChange={ctl.setParams} />
          </section>
        </aside>

        <div className="[grid-area:lesson] min-w-0 xl:sticky xl:top-20 xl:self-start">
          <LessonPanel simId={module.id} steps={module.lesson} applyScene={ctl.applyScene} />
        </div>

        <div className="[grid-area:challenges] min-w-0 space-y-8">
          <ChallengePanel simId={module.id} challenges={module.challenges} params={ctl.params} applyScene={ctl.applyScene} />
          <div className="grid gap-4">
            {module.solver && <StepSolver kind={module.solver} />}
            <QuizPanel topic={module.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceHeader({ entry, mastery: m }: { entry: TopicEntry; mastery?: number }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pt-8 pb-6">
      <div>
        <nav aria-label="Konum" className="font-mono text-[12px] text-ink-3">
          <Link to="/#konular" className="hover:text-ink">
            Konular
          </Link>
          <span className="mx-2">/</span>
          <span>{TIERS[entry.tier].title}</span>
        </nav>
        <h1 className="mt-2 font-display text-[clamp(44px,5.5vw,76px)] leading-[0.95] text-ink">{entry.title}</h1>
        <p className="mt-2 text-[16px] text-ink-2">{entry.subtitle}</p>
      </div>
      {m !== undefined && (
        <div className="min-w-[200px]">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="eyebrow">Ustalık</span>
            <span className="font-mono text-[13px] text-ink">%{Math.round(m * 100)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-rule" role="progressbar" aria-valuenow={Math.round(m * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-tan transition-[width] duration-700" style={{ width: `${m * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-3">Ders %40 · Görevler %60</p>
        </div>
      )}
    </header>
  );
}

function WorkspaceSkeleton({ entry }: { entry: TopicEntry }) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-8">
      <WorkspaceHeader entry={entry} />
      <div className="h-[420px] animate-pulse rounded-xl border border-rule bg-elev" />
    </div>
  );
}

function ComingSoon({ entry }: { entry: TopicEntry }) {
  return (
    <Centered title={entry.title}>
      Bu simülasyon yol haritasında: <strong className="text-ink">{TIERS[entry.tier].title}</strong>. Şimdilik hazır olan
      konularla devam edebilirsin.
    </Centered>
  );
}

function Centered({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-[52px] leading-none text-ink">{title}</h1>
      <p className="mt-4 text-[16px] text-ink-2">{children}</p>
      <Link to="/#konular" className="btn-primary mt-8">
        ← Konulara dön
      </Link>
    </div>
  );
}
