/**
 * Backend istemcisi. Erişim belirteci bellekte tutulur (XSS ile çalınması zorlaşsın diye
 * localStorage kullanılmaz); süresi dolunca httpOnly çerezdeki yenileme belirteciyle bir kez
 * sessizce yenilenir ve istek tekrarlanır.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let onSessionChange: ((token: string | null, user: unknown) => void) | null = null;
let refreshing: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function onSession(cb: typeof onSessionChange) {
  onSessionChange = cb;
}

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg).replace(/^Value error, /, '');
  }
  if (status === 429) return 'Çok fazla deneme yaptın; bir dakika sonra tekrar dene.';
  if (status >= 500) return 'Sunucuya ulaşılamadı. Python API çalışıyor mu?';
  return 'Beklenmeyen bir hata oluştu.';
}

export async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        accessToken = null;
        onSessionChange?.(null, null);
        return false;
      }
      const body = await res.json();
      accessToken = body.access_token;
      onSessionChange?.(body.access_token, body.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers,
      credentials: 'include',
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. Python API çalışıyor mu?', 0);
  }
  if (res.status === 401 && retry && accessToken && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(messageFrom(body, res.status), res.status);
  return body as T;
}
