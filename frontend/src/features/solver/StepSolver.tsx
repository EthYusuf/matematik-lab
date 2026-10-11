import { useState, type FormEvent } from 'react';
import type { SolverKind } from '../../core/types';
import { Tex } from '../../core/ui/Tex';
import { api, ApiError } from '../api/client';

interface Step {
  rule: string;
  formula: string;
  expression: string;
  result: string;
  depth: number;
}

interface Solution {
  input: string;
  steps: Step[];
  verified?: boolean;
  simplified?: string;
  antiderivative?: string;
  definite?: { value: string } | null;
  value?: string | null;
  exists?: boolean;
  left?: string | null;
  right?: string | null;
}

const CONFIG: Record<SolverKind, { title: string; examples: string[]; placeholder: string }> = {
  derivative: { title: 'Türevini al', examples: ['x^2 sin(x)', '(x^2+1)/(x-3)', 'e^(3x) + ln(x^2+1)', 'sqrt(1 - x^2)'], placeholder: 'ör. x^2 sin(x)' },
  integral: { title: 'İntegralini al', examples: ['x e^x', '3x^2 + 2x', 'x^2 sin(x)', '1/(1+x^2)'], placeholder: 'ör. x e^x' },
  limit: { title: 'Limitini bul', examples: ['(x^2-1)/(x-1)', 'sin(x)/x', 'abs(x)/x', '(3x^2+1)/(x^2-2)'], placeholder: 'ör. (x^2-1)/(x-1)' },
};

/** Python (FastAPI + SymPy) backend'iyle adım adım çözüm. */
export function StepSolver({ kind }: { kind: SolverKind }) {
  const cfg = CONFIG[kind];
  const [expression, setExpression] = useState(cfg.examples[0]);
  const [lower, setLower] = useState('');
  const [upper, setUpper] = useState('');
  const [point, setPoint] = useState(kind === 'limit' ? '1' : '');
  const [direction, setDirection] = useState<'both' | 'left' | 'right'>('both');
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const solve = async (e?: FormEvent, expr = expression) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body =
        kind === 'integral'
          ? { expression: expr, lower: lower || null, upper: upper || null }
          : kind === 'limit'
            ? { expression: expr, point: point || '0', direction }
            : { expression: expr };
      setSolution(await api<Solution>(`/math/${kind}`, { method: 'POST', json: body }));
    } catch (err) {
      setSolution(null);
      setError(err instanceof ApiError ? err.message : 'Çözülemedi.');
    } finally {
      setBusy(false);
    }
  };

  const final =
    solution &&
    (kind === 'derivative'
      ? `\\frac{d}{dx}\\left[${solution.input}\\right] = ${solution.simplified}`
      : kind === 'integral'
        ? solution.definite
          ? `\\int_{${lower}}^{${upper}} ${solution.input}\\,dx = ${solution.definite.value}`
          : `\\int ${solution.input}\\,dx = ${solution.antiderivative}`
        : solution.exists
          ? `${solution.input} = ${solution.value}`
          : `${solution.input}\\ \\text{yok: } ${solution.left} \\ne ${solution.right}`);

  return (
    <section aria-label="Adım adım çözüm" className="rounded-xl border border-rule bg-elev p-5 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Adım adım çözüm · {cfg.title}</p>
        <p className="font-mono text-[11px] text-ink-3">Python · SymPy</p>
      </div>
      <form onSubmit={solve} className="flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1 block text-[12px] text-ink-3">f(x)</span>
          <input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder={cfg.placeholder}
            maxLength={120}
            spellCheck={false}
            className="w-full rounded-lg border border-rule-strong bg-bg px-3 py-2 font-mono text-[15px] text-ink outline-none focus:border-ink"
          />
        </label>
        {kind === 'integral' && (
          <>
            <SmallInput label="alt sınır" value={lower} onChange={setLower} placeholder="ops." />
            <SmallInput label="üst sınır" value={upper} onChange={setUpper} placeholder="ops." />
          </>
        )}
        {kind === 'limit' && (
          <>
            <SmallInput label="x →" value={point} onChange={setPoint} placeholder="0, pi, oo" />
            <label>
              <span className="mb-1 block text-[12px] text-ink-3">yön</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as typeof direction)}
                className="rounded-lg border border-rule-strong bg-bg px-2 py-2 font-mono text-[14px] text-ink"
              >
                <option value="both">iki yönlü</option>
                <option value="left">soldan (−)</option>
                <option value="right">sağdan (+)</option>
              </select>
            </label>
          </>
        )}
        <button type="submit" disabled={busy || !expression.trim()} className="btn-primary !py-2.5">
          {busy ? 'Hesaplanıyor…' : 'Çöz'}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {cfg.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setExpression(ex);
              solve(undefined, ex);
            }}
            className="rounded-md border border-rule px-2 py-0.5 font-mono text-[12px] text-ink-2 hover:border-ink-3 hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-lg border border-bad/40 bg-bad/5 px-3 py-2 text-[13px] text-bad">{error}</p>}

      {solution && (
        <div className="reveal mt-4">
          <ol className="space-y-2">
            {solution.steps.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-rule bg-bg/60 p-3"
                style={{ marginLeft: `${Math.min(s.depth, 4) * 18}px` }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[13px] font-semibold text-ink">
                    <span className="mr-2 font-mono text-[11px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                    {s.rule}
                  </p>
                  {s.formula && <Tex math={s.formula} className="text-[12px] text-ink-3" />}
                </div>
                <div className="mt-1.5 overflow-x-auto text-[14px] text-ink-2">
                  <Tex math={s.result ? `${s.expression} = ${s.result}` : s.expression} />
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink bg-sunk px-4 py-3">
            <div className="overflow-x-auto text-[16px] text-ink">
              <Tex math={final ?? ""} />
            </div>
            {solution.verified !== undefined && (
              <span className={`font-mono text-[11px] ${solution.verified ? 'text-tan' : 'text-ink-3'}`}>
                {solution.verified ? '✓ SymPy ile doğrulandı' : 'doğrulanamadı'}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SmallInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="w-24">
      <span className="mb-1 block text-[12px] text-ink-3">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={20}
        className="w-full rounded-lg border border-rule-strong bg-bg px-2 py-2 font-mono text-[14px] text-ink outline-none focus:border-ink"
      />
    </label>
  );
}
