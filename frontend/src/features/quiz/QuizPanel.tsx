import { useCallback, useEffect, useState } from 'react';
import { RichText } from '../../core/ui/RichText';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/store';
import { announceBadges } from '../progress/sync';

interface Question {
  topic: string;
  seed: number;
  prompt: string;
  kind: 'number' | 'choice';
  options: string[] | null;
}

interface CheckResult {
  correct: boolean;
  expected: string;
  explanation: string;
  parsed: boolean;
  new_badges: string[];
  next_review_days: number | null;
}

interface QuizPanelProps {
  topic: string;
  review?: boolean;
  onAnswered?: (correct: boolean) => void;
  title?: string;
}

/** Python backend'in ürettiği parametrik soru. Her "Yeni soru" farklı sayılarla gelir. */
export function QuizPanel({ topic, review = false, onAnswered, title = 'Pekiştirme sorusu' }: QuizPanelProps) {
  const status = useAuth((s) => s.status);
  const [q, setQ] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setAnswer('');
    setChoice(null);
    try {
      setQ(await api<Question>(`/quiz/${topic}`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Soru alınamadı.');
    } finally {
      setBusy(false);
    }
  }, [topic]);

  useEffect(() => {
    load();
  }, [load]);

  const check = async () => {
    if (!q) return;
    const value = q.kind === 'choice' ? String(choice) : answer;
    setBusy(true);
    try {
      const r = await api<CheckResult>(`/quiz/${topic}/check`, { method: 'POST', json: { seed: q.seed, answer: value, review } });
      if (!r.parsed) {
        setError('Cevabı sayı olarak yaz: ör. 2 · −1,5 · 3/4 · π/2');
      } else {
        setError(null);
        setResult(r);
        announceBadges(r.new_badges);
        onAnswered?.(r.correct);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kontrol edilemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={title} className="rounded-xl border border-rule bg-elev p-5 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">{title}</p>
        <p className="font-mono text-[11px] text-ink-3">Python ile üretildi · her seferinde yeni sayılar</p>
      </div>

      {!q && error && (
        <div className="rounded-lg border border-dashed border-rule-strong p-4 text-[14px] text-ink-2">
          <p>{error}</p>
          <p className="mt-1 text-[12px] text-ink-3">Sorular Python (FastAPI + SymPy) backend'inden gelir. Backend'i başlatınca burada belirir.</p>
          <button type="button" onClick={load} className="btn-ghost mt-3">
            ↻ Tekrar dene
          </button>
        </div>
      )}
      {!q && !error && <div className="h-24 animate-pulse rounded-lg bg-sunk" />}

      {q && (
        <div className={busy ? 'opacity-60' : ''}>
          <RichText text={q.prompt} className="text-[16px] leading-relaxed text-ink" />

          {q.kind === 'choice' && q.options ? (
            <div role="radiogroup" className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={choice === i}
                  disabled={!!result}
                  onClick={() => setChoice(i)}
                  className={`rounded-lg border px-3 py-2 text-left text-[14px] transition-colors ${
                    choice === i ? 'border-ink bg-sunk text-ink' : 'border-rule text-ink-2 enabled:hover:border-ink-3'
                  }`}
                >
                  <RichText text={o} />
                </button>
              ))}
            </div>
          ) : (
            <input
              value={answer}
              disabled={!!result}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !result && answer.trim() && check()}
              placeholder="Cevabın: ör. 12 · 3/4 · π/2"
              inputMode="decimal"
              aria-label="Cevabın"
              className="mt-4 w-full max-w-xs rounded-lg border border-rule-strong bg-bg px-3 py-2 font-mono text-[15px] text-ink outline-none focus:border-ink disabled:opacity-70"
            />
          )}
          {error && <p className="mt-2 text-[13px] text-bad">{error}</p>}

          {!result ? (
            <button
              type="button"
              onClick={check}
              disabled={busy || (q.kind === 'choice' ? choice === null : !answer.trim())}
              className="btn-primary mt-4"
            >
              Kontrol et
            </button>
          ) : (
            <div className="reveal mt-4 rounded-lg border border-rule bg-sunk/70 p-4">
              <p className={`font-display text-[22px] leading-tight ${result.correct ? 'text-tan' : 'text-hot'}`}>
                {result.correct ? 'Doğru!' : 'Bu sefer olmadı.'}
              </p>
              {!result.correct && (
                <p className="mt-1 text-[14px] text-ink-2">
                  Doğru cevap: <RichText text={result.expected} className="inline-block align-middle [&_p]:inline" />
                </p>
              )}
              <RichText text={result.explanation} className="mt-2 text-[14px] leading-relaxed text-ink-2" />
              {result.next_review_days !== null ? (
                <p className="mt-2 font-mono text-[12px] text-ink-3">
                  Aralıklı tekrar: bu konu {result.next_review_days} gün sonra tekrar sorulacak.
                </p>
              ) : (
                status !== 'authenticated' && (
                  <p className="mt-2 text-[12px] text-ink-3">Giriş yaparsan konular aralıklı tekrar listene eklenir ve doğru zamanda yeniden sorulur.</p>
                )
              )}
              <button type="button" onClick={load} className="btn-primary mt-3">
                Yeni soru →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
