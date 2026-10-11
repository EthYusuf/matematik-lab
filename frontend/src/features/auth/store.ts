import { create } from 'zustand';
import { api, onSession, refreshSession, setAccessToken } from '../api/client';

export interface User {
  id: number;
  username: string;
  display_name: string;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  user: User;
}

type Status = 'unknown' | 'anonymous' | 'authenticated';

// Gizli değil: yalnızca "bu tarayıcıda açık bir oturum olabilir" ipucu. Asıl belirteç httpOnly çerezde.
const HINT = 'matematik-lab-session';
const hint = {
  get: () => {
    try {
      return localStorage.getItem(HINT) === '1';
    } catch {
      return false;
    }
  },
  set: (on: boolean) => {
    try {
      if (on) localStorage.setItem(HINT, '1');
      else localStorage.removeItem(HINT);
    } catch {
      // yoksay
    }
  },
};

interface AuthState {
  status: Status;
  user: User | null;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, consent: boolean) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set) => {
  onSession((token, user) => {
    hint.set(Boolean(token));
    set(token ? { status: 'authenticated', user: user as User } : { status: 'anonymous', user: null });
  });

  const accept = (t: TokenResponse) => {
    setAccessToken(t.access_token);
    hint.set(true);
    set({ status: 'authenticated', user: t.user });
  };

  const signOut = () => {
    setAccessToken(null);
    hint.set(false);
    set({ status: 'anonymous', user: null });
  };

  return {
    status: 'unknown',
    user: null,
    bootstrap: async () => {
      // Sayfa yenilendiğinde oturumu httpOnly çerezden geri getir (yalnızca daha önce giriş yapıldıysa).
      if (!hint.get()) {
        set({ status: 'anonymous', user: null });
        return;
      }
      if (!(await refreshSession())) signOut();
    },
    login: async (username, password) => accept(await api<TokenResponse>('/auth/login', { method: 'POST', json: { username, password } })),
    register: async (username, password, displayName, consent) =>
      accept(await api<TokenResponse>('/auth/register', { method: 'POST', json: { username, password, display_name: displayName || null, consent } })),
    logout: async () => {
      await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      signOut();
    },
    deleteAccount: async () => {
      await api('/auth/me', { method: 'DELETE' });
      signOut();
    },
  };
});
