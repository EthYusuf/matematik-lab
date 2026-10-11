import { useEffect, useState } from 'react';

export type ApiStatus = 'checking' | 'online' | 'offline';

/** Python (FastAPI) backend'inin ayakta olup olmadığını düzenli aralıklarla kontrol eder. */
export function useApiHealth(intervalMs = 30_000): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      try {
        const res = await fetch('/api/health', { signal: ctrl.signal });
        const body = res.ok ? await res.json() : null;
        if (alive) setStatus(body?.status === 'ok' ? 'online' : 'offline');
      } catch {
        if (alive) setStatus('offline');
      } finally {
        clearTimeout(timer);
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
