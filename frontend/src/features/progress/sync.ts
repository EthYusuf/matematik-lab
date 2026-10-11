import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/store';
import { useToasts } from '../toast/store';
import { BADGE_INFO } from './badges';
import { useProgress, type SimProgress } from './store';

interface ServerProgress {
  completed_steps: number[];
  predictions: Record<string, boolean>;
  solved_challenges: string[];
  hints_used: Record<string, number>;
  totals: { steps: number; challenges: number };
  mastery: number;
  updated_at: string;
}

interface SyncResponse {
  sims: Record<string, ServerProgress>;
  new_badges: string[];
}

const toServer = (p: SimProgress) => ({
  completed_steps: p.completedSteps,
  predictions: Object.fromEntries(Object.entries(p.predictions).map(([k, v]) => [String(k), v])),
  solved_challenges: p.solvedChallenges,
  hints_used: p.hintsUsed,
  totals: p.totals,
});

const fromServer = (p: ServerProgress): SimProgress => ({
  completedSteps: p.completed_steps,
  predictions: Object.fromEntries(Object.entries(p.predictions).map(([k, v]) => [Number(k), v])),
  solvedChallenges: p.solved_challenges,
  hintsUsed: p.hints_used,
  totals: p.totals,
  updatedAt: Date.parse(p.updated_at) || Date.now(),
});

export function announceBadges(ids: string[]) {
  const push = useToasts.getState().push;
  for (const id of ids) {
    const b = BADGE_INFO[id];
    if (b) push({ title: `Yeni rozet: ${b.title}`, body: 'Panelinde tüm rozetlerini görebilirsin.', icon: b.icon });
  }
}

/**
 * Oturum açıldığında tarayıcıdaki ilerlemeyi hesapla birleştirir; sonra her değişikliği
 * (1,2 sn gecikmeyle, toplu) sunucuya yazar. Oturum yoksa ilerleme yalnızca yerelde kalır.
 */
export function useProgressSync() {
  const status = useAuth((s) => s.status);
  const synced = useRef<Record<string, number>>({});

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ready = false;

    const local = useProgress.getState().sims;
    api<SyncResponse>('/progress/sync', { method: 'POST', json: { sims: Object.fromEntries(Object.entries(local).map(([k, v]) => [k, toServer(v)])) } })
      .then((res) => {
        if (cancelled) return;
        const merged = Object.fromEntries(Object.entries(res.sims).map(([k, v]) => [k, fromServer(v)]));
        synced.current = Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v.updatedAt]));
        useProgress.getState().replaceAll(merged);
        announceBadges(res.new_badges);
        ready = true;
      })
      .catch(() => undefined);

    const unsubscribe = useProgress.subscribe((state) => {
      if (!ready) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const changed = Object.entries(state.sims).filter(([id, p]) => synced.current[id] !== p.updatedAt);
        for (const [id, p] of changed) {
          synced.current[id] = p.updatedAt;
          try {
            const res = await api<SyncResponse>(`/progress/${id}`, { method: 'PUT', json: toServer(p) });
            announceBadges(res.new_badges);
          } catch {
            delete synced.current[id]; // bir sonraki değişiklikte tekrar denenir
          }
        }
      }, 1200);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [status]);
}
