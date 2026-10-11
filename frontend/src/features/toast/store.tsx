import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let next = 1;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = next++;
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => get().dismiss(id), 5200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="rise pointer-events-auto flex items-start gap-3 rounded-xl border border-ink bg-elev p-4 shadow-[var(--shadow)]">
          {t.icon && (
            <span className="text-2xl leading-none" aria-hidden>
              {t.icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] leading-tight text-ink">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] text-ink-2">{t.body}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="text-ink-3 hover:text-ink" aria-label="Kapat">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
