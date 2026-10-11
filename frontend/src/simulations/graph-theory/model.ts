import { num, str, type ParamState } from '../../core/types';

export interface City {
  id: string;
  name: string;
  /** Yaklaşık boylam / enlem (çizim için). */
  lon: number;
  lat: number;
}

export const CITIES: City[] = [
  { id: 'istanbul', name: 'İstanbul', lon: 29.0, lat: 41.0 },
  { id: 'bursa', name: 'Bursa', lon: 29.06, lat: 40.18 },
  { id: 'izmir', name: 'İzmir', lon: 27.14, lat: 38.42 },
  { id: 'eskisehir', name: 'Eskişehir', lon: 30.52, lat: 39.78 },
  { id: 'ankara', name: 'Ankara', lon: 32.85, lat: 39.93 },
  { id: 'konya', name: 'Konya', lon: 32.48, lat: 37.87 },
  { id: 'antalya', name: 'Antalya', lon: 30.71, lat: 36.89 },
  { id: 'kayseri', name: 'Kayseri', lon: 35.49, lat: 38.73 },
  { id: 'samsun', name: 'Samsun', lon: 36.33, lat: 41.29 },
  { id: 'trabzon', name: 'Trabzon', lon: 39.72, lat: 41.0 },
];

/** Yaklaşık karayolu mesafeleri (km) — eğitim amaçlı yuvarlanmıştır. */
export const ROADS: [string, string, number][] = [
  ['istanbul', 'bursa', 155],
  ['istanbul', 'eskisehir', 330],
  ['istanbul', 'ankara', 450],
  ['bursa', 'izmir', 330],
  ['bursa', 'eskisehir', 150],
  ['izmir', 'antalya', 445],
  ['eskisehir', 'ankara', 235],
  ['eskisehir', 'konya', 340],
  ['ankara', 'konya', 260],
  ['ankara', 'kayseri', 315],
  ['ankara', 'samsun', 410],
  ['konya', 'antalya', 300],
  ['konya', 'kayseri', 320],
  ['samsun', 'trabzon', 330],
  ['kayseri', 'trabzon', 640],
];

const adjacency = (() => {
  const adj = new Map<string, { to: string; w: number }[]>(CITIES.map((c) => [c.id, []]));
  for (const [a, b, w] of ROADS) {
    adj.get(a)!.push({ to: b, w });
    adj.get(b)!.push({ to: a, w });
  }
  // Komşular alfabetik: BFS sırası tekrarlanabilir olsun.
  for (const list of adj.values()) list.sort((x, y) => x.to.localeCompare(y.to));
  return adj;
})();

export type Algorithm = 'bfs' | 'dijkstra';

export interface Snapshot {
  /** Kesinleşen (kuyruktan çıkan) düğümler, sırayla. */
  done: string[];
  dist: Record<string, number>;
  prev: Record<string, string | null>;
  frontier: string[];
  current: string | null;
}

/** Algoritmanın her adımdaki durumunu kaydeder: snapshot[k] = k düğüm kesinleştikten sonra. */
export function trace(alg: Algorithm, start: string): Snapshot[] {
  const dist: Record<string, number> = Object.fromEntries(CITIES.map((c) => [c.id, Infinity]));
  const prev: Record<string, string | null> = Object.fromEntries(CITIES.map((c) => [c.id, null]));
  dist[start] = 0;
  const done: string[] = [];
  const frontier = new Set([start]);
  const snaps: Snapshot[] = [{ done: [], dist: { ...dist }, prev: { ...prev }, frontier: [start], current: null }];
  const queue = [start]; // BFS için FIFO

  while (frontier.size) {
    let u: string;
    if (alg === 'bfs') {
      u = queue.shift()!;
    } else {
      u = [...frontier].sort((a, b) => dist[a] - dist[b] || a.localeCompare(b))[0];
    }
    frontier.delete(u);
    done.push(u);
    for (const { to, w } of adjacency.get(u)!) {
      if (done.includes(to)) continue;
      const nd = dist[u] + (alg === 'bfs' ? 1 : w);
      if (alg === 'bfs') {
        if (dist[to] === Infinity) {
          dist[to] = nd;
          prev[to] = u;
          frontier.add(to);
          queue.push(to);
        }
      } else if (nd < dist[to]) {
        dist[to] = nd;
        prev[to] = u;
        frontier.add(to);
      }
    }
    snaps.push({ done: [...done], dist: { ...dist }, prev: { ...prev }, frontier: [...frontier], current: u });
  }
  return snaps;
}

export function pathTo(s: Snapshot, target: string): string[] {
  if (!s.done.includes(target)) return [];
  const path = [target];
  while (s.prev[path[0]]) path.unshift(s.prev[path[0]]!);
  return path;
}

export function pathLength(path: string[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const r = ROADS.find(([a, b]) => (a === path[i - 1] && b === path[i]) || (b === path[i - 1] && a === path[i]));
    total += r ? r[2] : 0;
  }
  return total;
}

export const cityName = (id: string) => CITIES.find((c) => c.id === id)?.name ?? id;

export function graphState(p: ParamState) {
  const alg = (str(p, 'alg') as Algorithm) || 'dijkstra';
  const start = str(p, 'start');
  const target = str(p, 'target');
  const snaps = trace(alg, start);
  const step = Math.max(0, Math.min(snaps.length - 1, Math.round(num(p, 'step'))));
  const snap = snaps[step];
  return { alg, start, target, snaps, step, snap, path: pathTo(snap, target) };
}
