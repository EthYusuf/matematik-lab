import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router';
import { EXAMPLES } from '../features/python-lab/examples';
import { findTopic } from '../simulations/catalog';

type Status = 'loading' | 'ready' | 'running' | 'error';

interface Output {
  kind: 'stdout' | 'stderr' | 'error' | 'result';
  text: string;
}

/** Pyodide worker'ı: yüklenir, kodu çalıştırır, gerekirse sonlandırılıp yeniden kurulur. */
function usePython() {
  const worker = useRef<Worker | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [version, setVersion] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [figures, setFigures] = useState<string[]>([]);
  const runId = useRef(0);

  const boot = useCallback(() => {
    worker.current?.terminate();
    setStatus('loading');
    const w = new Worker('/pyodide-worker.mjs', { type: 'module' });
    w.onerror = (e) => {
      setStatus('error');
      setOutputs([{ kind: 'error', text: `Python yüklenemedi (internet bağlantısı gerekir): ${e.message || 'bilinmeyen hata'}` }]);
    };
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'ready') {
        setVersion(m.version);
        setStatus('ready');
      } else if (m.type === 'fatal') {
        setStatus('error');
        setOutputs([{ kind: 'error', text: `Python yüklenemedi (internet bağlantısı gerekir): ${m.text}` }]);
      } else if (m.id === runId.current) {
        if (m.type === 'stdout' || m.type === 'stderr') setOutputs((o) => [...o, { kind: m.type, text: m.text }]);
        else if (m.type === 'error') {
          setOutputs((o) => [...o, { kind: 'error', text: m.text }]);
          setStatus('ready');
        } else if (m.type === 'done') {
          if (m.result !== null) setOutputs((o) => [...o, { kind: 'result', text: m.result }]);
          setFigures(m.figures);
          setStatus('ready');
        }
      }
    };
    worker.current = w;
  }, []);

  useEffect(() => {
    boot();
    return () => worker.current?.terminate();
  }, [boot]);

  const run = (code: string) => {
    if (!worker.current || status === 'loading') return;
    runId.current += 1;
    setOutputs([]);
    setFigures([]);
    setStatus('running');
    worker.current.postMessage({ id: runId.current, code });
  };

  const stop = () => {
    setOutputs((o) => [...o, { kind: 'error', text: 'Durduruldu. Python yeniden başlatılıyor…' }]);
    boot();
  };

  return { status, version, outputs, figures, run, stop };
}

export function PythonLabPage() {
  const [params, setParams] = useSearchParams();
  const initial = EXAMPLES.find((e) => e.id === params.get('ornek')) ?? EXAMPLES[0];
  const [active, setActive] = useState(initial.id);
  const [code, setCode] = useState(initial.code);
  const py = usePython();

  const select = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id)!;
    setActive(id);
    setCode(ex.code);
    setParams({ ornek: id }, { replace: true });
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      py.run(code);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = `${code.slice(0, s)}    ${code.slice(end)}`;
      setCode(next);
      requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
    }
  };

  const lines = code.split('\n').length;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tarayıcıda gerçek Python · Pyodide (WebAssembly)</p>
          <h1 className="mt-2 font-display text-[clamp(44px,6vw,80px)] leading-[0.95] text-ink">
            Python <em className="text-hot">Lab</em>
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-2">
            Simülasyonların arkasındaki matematiği kendin kodla. NumPy, Matplotlib ve SymPy hazır; kurulum yok, kod bilgisayarına hiçbir şey
            yüklemez.
          </p>
        </div>
        <StatusPill status={py.status} version={py.version} />
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
        <nav aria-label="Örnekler" className="xl:sticky xl:top-20 xl:self-start">
          <p className="eyebrow mb-2">Deneyler</p>
          <ul className="flex gap-1.5 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">
            {EXAMPLES.map((ex) => (
              <li key={ex.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => select(ex.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${active === ex.id ? 'border-ink bg-elev' : 'border-rule hover:border-ink-3'}`}
                >
                  <span className="block text-[14px] font-medium text-ink">{ex.title}</span>
                  <span className="block font-mono text-[11px] text-ink-3">{findTopic(ex.topic)?.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Kod düzenleyici" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-rule-strong bg-elev shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <p className="eyebrow">deney.py</p>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">Ctrl + Enter</span>
              {py.status === 'running' ? (
                <button type="button" onClick={py.stop} className="btn-ghost !py-1.5">
                  ■ Durdur
                </button>
              ) : (
                <button type="button" onClick={() => py.run(code)} disabled={py.status !== 'ready'} className="btn-primary !py-1.5">
                  ▶ Çalıştır
                </button>
              )}
            </div>
          </div>
          <div className="flex min-h-[460px] flex-1 font-mono text-[13.5px] leading-[1.6]">
            <div aria-hidden className="select-none border-r border-rule bg-sunk/50 px-3 py-3 text-right text-ink-3">
              {Array.from({ length: lines }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              aria-label="Python kodu"
              className="min-w-0 flex-1 resize-none bg-transparent px-4 py-3 whitespace-pre text-ink outline-none"
              style={{ height: `${Math.max(460, lines * 21.6 + 24)}px` }}
            />
          </div>
        </section>

        <section aria-label="Çıktı" aria-live="polite" className="min-w-0 rounded-xl border border-rule bg-elev shadow-[var(--shadow)]">
          <div className="border-b border-rule px-4 py-2.5">
            <p className="eyebrow">Çıktı</p>
          </div>
          <div className="space-y-4 p-4">
            {py.outputs.length === 0 && py.figures.length === 0 && (
              <p className="text-[14px] text-ink-3">
                {py.status === 'loading' ? 'Python ilk açılışta indiriliyor (~15 MB, sonra önbellekte)…' : 'Kodu çalıştır; çıktılar ve grafikler burada görünür.'}
              </p>
            )}
            {py.outputs.length > 0 && (
              <pre className="overflow-x-auto rounded-lg bg-sunk p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
                {py.outputs.map((o, i) => (
                  <span key={i} className={o.kind === 'error' || o.kind === 'stderr' ? 'text-bad' : o.kind === 'result' ? 'text-tan' : 'text-ink'}>
                    {o.text}
                    {'\n'}
                  </span>
                ))}
              </pre>
            )}
            {py.figures.map((f, i) => (
              <img key={i} src={`data:image/png;base64,${f}`} alt={`Grafik ${i + 1}`} className="w-full rounded-lg border border-rule bg-white" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status, version }: { status: Status; version: string | null }) {
  const label =
    status === 'loading' ? 'Python yükleniyor…' : status === 'running' ? 'Çalışıyor…' : status === 'error' ? 'Yüklenemedi' : `Hazır · Python ${version ?? ''}`;
  const dot = status === 'ready' ? 'bg-ok' : status === 'error' ? 'bg-bad' : 'bg-pt animate-pulse';
  return (
    <span className="flex items-center gap-2 rounded-md border border-rule px-3 py-2 font-mono text-[12px] text-ink-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
