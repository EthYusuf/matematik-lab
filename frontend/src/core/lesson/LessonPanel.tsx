import { useEffect, useState } from 'react';
import { useProgress } from '../../features/progress/store';
import { fmtPi } from '../math/format';
import { parseAnswer } from '../math/parse';
import type { LessonStep, Scene } from '../types';
import { RichText } from '../ui/RichText';

interface LessonPanelProps {
  simId: string;
  steps: LessonStep[];
  applyScene: (scene: Scene | undefined) => void;
}

const STAGE_LABEL: Record<LessonStep['kind'], string> = {
  explore: 'Keşfet',
  'predict-choice': 'Tahmin et',
  'predict-number': 'Tahmin et',
};

export function LessonPanel({ simId, steps, applyScene }: LessonPanelProps) {
  const completed = useProgress((s) => s.sims[simId]?.completedSteps) ?? [];
  const completeStep = useProgress((s) => s.completeStep);
  const [index, setIndex] = useState(() => {
    const firstOpen = steps.findIndex((_, i) => !completed.includes(i));
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const finished = steps.every((_, i) => completed.includes(i));

  const step = steps[index];

  // Adıma girildiğinde simülasyonu o adımın başlangıç sahnesine kur.
  useEffect(() => {
    if (step.kind === 'explore') applyScene(step.scene);
    else if (step.setup) applyScene({ patch: step.setup });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    completeStep(simId, index);
    if (index < steps.length - 1) setIndex(index + 1);
  };

  return (
    <section aria-labelledby="lesson-title" className="rounded-xl border border-rule bg-elev shadow-[var(--shadow)]">
      <header className="flex items-center justify-between border-b border-rule px-5 py-3">
        <h2 id="lesson-title" className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3">
          Ders · {index + 1}/{steps.length}
        </h2>
        <ol className="flex gap-1.5" aria-label="Ders adımları">
          {steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. adım: ${s.title}`}
                aria-current={i === index ? 'step' : undefined}
                className={`block h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-ink' : completed.includes(i) ? 'w-2 bg-tan' : 'w-2 bg-rule-strong hover:bg-ink-3'
                }`}
              />
            </li>
          ))}
        </ol>
      </header>

      <div key={index} className="rise px-5 pt-4 pb-5">
        <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-hot">{STAGE_LABEL[step.kind]}</p>
        <h3 className="mb-3 font-display text-[26px] leading-[1.1] text-ink">{step.title}</h3>

        {step.kind === 'explore' && <ExploreStep step={step} onScene={() => applyScene(step.scene)} onNext={next} isLast={index === steps.length - 1} />}
        {step.kind !== 'explore' && (
          <PredictStep step={step} simId={simId} stepIndex={index} applyScene={applyScene} onNext={next} isLast={index === steps.length - 1} />
        )}
      </div>

      {finished && (
        <div className="border-t border-rule bg-sunk/60 px-5 py-3 text-[13px] text-ink-2">
          <span className="font-semibold text-tan">Ders tamamlandı.</span> Şimdi{' '}
          <a href="#gorevler" className="underline decoration-hot decoration-2 underline-offset-2 hover:text-ink">
            görevlere geç
          </a>{' '}
          ve öğrendiğini kendin kur.
        </div>
      )}
    </section>
  );
}

function ExploreStep({
  step,
  onScene,
  onNext,
  isLast,
}: {
  step: Extract<LessonStep, { kind: 'explore' }>;
  onScene: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <>
      <RichText text={step.body} className="text-[15px] leading-relaxed text-ink-2" />
      <div className="mt-5 flex flex-wrap gap-2">
        {step.scene && (
          <button type="button" onClick={onScene} className="btn-ghost">
            ▶ {step.sceneLabel ?? 'Göster'}
          </button>
        )}
        <button type="button" onClick={onNext} className="btn-primary">
          {isLast ? 'Dersi bitir' : 'Anladım, devam'} →
        </button>
      </div>
    </>
  );
}

type PredictStepT = Extract<LessonStep, { kind: 'predict-choice' | 'predict-number' }>;

function PredictStep({
  step,
  simId,
  stepIndex,
  applyScene,
  onNext,
  isLast,
}: {
  step: PredictStepT;
  simId: string;
  stepIndex: number;
  applyScene: (scene: Scene | undefined) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const recordPrediction = useProgress((s) => s.recordPrediction);
  const [choice, setChoice] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const locked = result !== null;

  const lock = () => {
    let correct: boolean;
    if (step.kind === 'predict-choice') {
      if (choice === null) return;
      correct = choice === step.correctIndex;
    } else {
      const value = parseAnswer(typed);
      if (value === null) {
        setError('Bir sayı yaz: ör. 1,5 · −2 · π/2');
        return;
      }
      setError(null);
      correct = Math.abs(value - step.answer) <= step.tolerance;
    }
    recordPrediction(simId, stepIndex, correct);
    setResult(correct);
    applyScene(step.observe);
  };

  return (
    <>
      <RichText text={step.question} className="text-[15px] leading-relaxed text-ink" />

      {step.kind === 'predict-choice' ? (
        <div role="radiogroup" className="mt-4 space-y-1.5">
          {step.options.map((opt, i) => {
            const selected = choice === i;
            const isAnswer = locked && i === step.correctIndex;
            const isWrongPick = locked && selected && i !== step.correctIndex;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={locked}
                onClick={() => setChoice(i)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-[14px] transition-colors ${
                  isAnswer
                    ? 'border-tan bg-tan/10 text-ink'
                    : isWrongPick
                      ? 'border-bad bg-bad/10 text-ink line-through decoration-bad/60'
                      : selected
                        ? 'border-ink bg-sunk text-ink'
                        : 'border-rule text-ink-2 enabled:hover:border-ink-3 enabled:hover:text-ink'
                }`}
              >
                <span className="mt-px font-mono text-[12px] text-ink-3">{String.fromCharCode(65 + i)}</span>
                <RichText text={opt} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <span className="sr-only">Tahminin</span>
            <input
              value={typed}
              disabled={locked}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !locked && lock()}
              inputMode="decimal"
              placeholder="ör. 2 · 1,5 · π/2"
              className="w-40 rounded-lg border border-rule-strong bg-bg px-3 py-2 font-mono text-[15px] text-ink outline-none focus:border-ink disabled:opacity-70"
            />
          </label>
          {error && <p className="mt-1.5 text-[13px] text-bad">{error}</p>}
        </div>
      )}

      {!locked ? (
        <button
          type="button"
          onClick={lock}
          disabled={step.kind === 'predict-choice' ? choice === null : typed.trim() === ''}
          className="btn-primary mt-4"
        >
          Tahminimi kilitle ve gözlemle
        </button>
      ) : (
        <div className="reveal mt-5 rounded-lg border border-rule bg-sunk/70 p-4">
          <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3">Gözlem</p>
          <p className={`mb-2 font-display text-[22px] leading-tight ${result ? 'text-tan' : 'text-hot'}`}>
            {result ? 'Tahminin doğru!' : 'Beklenmedik bir sonuç!'}
          </p>
          {!result && step.kind === 'predict-number' && (
            <p className="mb-2 text-[14px] text-ink-2">
              Doğru cevap: <span className="font-mono text-ink">{fmtPi(step.answer)}</span>
            </p>
          )}
          {!result && (
            <p className="mb-2 text-[13px] italic text-ink-3">
              Tahminin tutmadığında beyin daha çok dikkat eder — bu sonucu hatırlayacaksın.
            </p>
          )}
          <RichText text={step.explain} className="text-[14px] leading-relaxed text-ink-2" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => applyScene(step.observe)} className="btn-ghost">
              ↻ Tekrar izle
            </button>
            <button type="button" onClick={onNext} className="btn-primary">
              {isLast ? 'Dersi bitir' : 'Sonraki adım'} →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
