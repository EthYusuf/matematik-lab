import { useEffect, useState } from 'react';
import { useProgress } from '../../features/progress/store';
import type { Challenge, ParamState, Scene } from '../types';
import { RichText } from '../ui/RichText';

interface ChallengePanelProps {
  simId: string;
  challenges: Challenge[];
  params: ParamState;
  applyScene: (scene: Scene | undefined) => void;
}

/**
 * Görevler: hedef bir durum verilir, öğrenci parametrelerle o duruma ulaşır.
 * Yalnızca "Göreve başla" denmiş görev denetlenir; böylece ders sırasında
 * görevler kazara çözülmez.
 */
export function ChallengePanel({ simId, challenges, params, applyScene }: ChallengePanelProps) {
  const solved = useProgress((s) => s.sims[simId]?.solvedChallenges) ?? [];
  const hintsUsed = useProgress((s) => s.sims[simId]?.hintsUsed) ?? {};
  const solveChallenge = useProgress((s) => s.solveChallenge);
  const takeHint = useProgress((s) => s.takeHint);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [justSolved, setJustSolved] = useState<string | null>(null);

  const active = challenges.find((c) => c.id === activeId);

  useEffect(() => {
    if (active && active.check(params)) {
      solveChallenge(simId, active.id);
      setJustSolved(active.id);
      setActiveId(null);
    }
  }, [active, params, simId, solveChallenge]);

  const start = (c: Challenge) => {
    setJustSolved(null);
    setActiveId(c.id);
    if (c.setup) applyScene({ patch: c.setup });
  };

  return (
    <section id="gorevler" aria-labelledby="challenges-title" className="scroll-mt-24">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="challenges-title" className="font-display text-[30px] leading-none text-ink">
          Görevler
        </h2>
        <p className="font-mono text-[12px] text-ink-3">
          {solved.length}/{challenges.length} çözüldü
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {challenges.map((c, i) => {
          const isSolved = solved.includes(c.id);
          const isActive = c.id === activeId;
          const shownHints = hintsUsed[c.id] ?? 0;
          return (
            <li
              key={c.id}
              className={`relative flex flex-col overflow-hidden rounded-xl border bg-elev p-4 transition-shadow ${
                isActive ? 'border-ink shadow-[0_0_0_3px_color-mix(in_srgb,var(--c-hot)_25%,transparent)]' : 'border-rule'
              }`}
            >
              <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3">
                Görev {String(i + 1).padStart(2, '0')}
              </p>
              <RichText text={c.prompt} className="pr-2 text-[14px] leading-relaxed text-ink" />

              {shownHints > 0 && (
                <ul className="mt-3 space-y-1.5 border-l-2 border-pt pl-3">
                  {c.hints.slice(0, shownHints).map((h, hi) => (
                    <li key={hi} className="reveal text-[13px] text-ink-2">
                      <RichText text={h} />
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                {isActive ? (
                  <>
                    <span className="flex items-center gap-2 text-[12px] font-medium text-hot">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-hot" />
                      </span>
                      Simülasyonu ayarla…
                    </span>
                    <button type="button" onClick={() => setActiveId(null)} className="ml-auto text-[12px] text-ink-3 hover:text-ink">
                      Bırak
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => start(c)} className={isSolved ? 'btn-ghost' : 'btn-primary'}>
                    {isSolved ? 'Yeniden dene' : 'Göreve başla'}
                  </button>
                )}
                {!isSolved && shownHints < c.hints.length && (
                  <button type="button" onClick={() => takeHint(simId, c.id)} className="text-[12px] text-ink-3 underline-offset-2 hover:text-ink hover:underline">
                    İpucu ({shownHints + 1}/{c.hints.length})
                  </button>
                )}
              </div>

              {isSolved && (
                <span
                  aria-label="Çözüldü"
                  className={`stamp pointer-events-none absolute top-3 right-3 px-2 py-0.5 text-[12px] ${
                    justSolved === c.id ? '' : '[animation:none] -rotate-[9deg]'
                  }`}
                >
                  ÇÖZÜLDÜ
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
