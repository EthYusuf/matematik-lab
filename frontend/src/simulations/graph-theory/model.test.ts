import { describe, expect, it } from 'vitest';
import { CITIES, pathLength, pathTo, trace } from './model';

const finalPath = (alg: 'bfs' | 'dijkstra', s: string, t: string) => {
  const snaps = trace(alg, s);
  return pathTo(snaps[snaps.length - 1], t);
};

describe('graf algoritmaları', () => {
  it('her şehir sonunda kesinleşir', () => {
    for (const alg of ['bfs', 'dijkstra'] as const) {
      const snaps = trace(alg, 'izmir');
      expect(snaps[snaps.length - 1].done).toHaveLength(CITIES.length);
      expect(snaps).toHaveLength(CITIES.length + 1);
    }
  });

  it('Dijkstra en kısa km yolunu bulur: İstanbul → Konya = 645 km', () => {
    const p = finalPath('dijkstra', 'istanbul', 'konya');
    expect(p).toEqual(['istanbul', 'bursa', 'eskisehir', 'konya']);
    expect(pathLength(p)).toBe(645);
  });

  it('BFS en az kenarlı yolu bulur (km olarak daha uzun olabilir)', () => {
    const p = finalPath('bfs', 'istanbul', 'konya');
    expect(p).toHaveLength(3);
    expect(pathLength(p)).toBeGreaterThan(645);
  });

  it('Dijkstra\'da şehirler uzaklık sırasıyla kesinleşir', () => {
    const snaps = trace('dijkstra', 'ankara');
    const last = snaps[snaps.length - 1];
    const order = last.done.map((c) => last.dist[c]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
