import type { SimulationModule } from '../core/types';

export type Tier = 1 | 2 | 3 | 4;
export type Level = 'lise' | 'universite';

export interface TopicEntry {
  id: string;
  title: string;
  subtitle: string;
  tier: Tier;
  level: Level[];
  /** Kartta çizilen küçük eğri: konunun "imzası". */
  glyph: (x: number) => number;
  /** Varsa simülasyon hazırdır; modül ilk ziyarette yüklenir. */
  load?: () => Promise<{ default: SimulationModule }>;
}

export const TIERS: Record<Tier, { title: string; note: string }> = {
  1: { title: 'Kademe 1', note: 'En çok talep gören — YKS ve Calculus I çekirdeği' },
  2: { title: 'Kademe 2', note: 'Yüksek talep — lise 11-12 ve üniversite 1. sınıf' },
  3: { title: 'Kademe 3', note: 'Üniversite — "vay be" dedirten konular' },
  4: { title: 'Bonus', note: 'Veri bilimi ve bilgisayar bilimi köprüleri' },
};

export const CATALOG: TopicEntry[] = [
  // Kademe 1
  {
    id: 'derivative-tangent',
    title: 'Türev',
    subtitle: 'Kesen doğrusu teğete dönüşürken türevi gör',
    tier: 1,
    level: ['lise', 'universite'],
    glyph: (x) => x * x,
    load: () => import('./derivative-tangent'),
  },
  {
    id: 'riemann-integral',
    title: 'İntegral',
    subtitle: 'Riemann dikdörtgenleriyle eğri altındaki alan',
    tier: 1,
    level: ['lise', 'universite'],
    glyph: (x) => Math.floor(x * 2) / 2 + 0.4,
    load: () => import('./riemann-integral'),
  },
  {
    id: 'trig-unit-circle',
    title: 'Trigonometri',
    subtitle: 'Birim çember dönerken sinüs dalgası doğar',
    tier: 1,
    level: ['lise'],
    glyph: (x) => Math.sin(x * 2.2),
    load: () => import('./trig-unit-circle'),
  },
  {
    id: 'function-transforms',
    title: 'Fonksiyonlar & Parabol',
    subtitle: 'Öteleme, yansıma, genişleme ve diskriminant',
    tier: 1,
    level: ['lise'],
    glyph: (x) => (x - 0.3) ** 2 * 1.6 - 0.8,
    load: () => import('./function-transforms'),
  },
  {
    id: 'probability-monte-carlo',
    title: 'Olasılık',
    subtitle: 'Monte Carlo, Galton tahtası ve Monty Hall',
    tier: 1,
    level: ['lise', 'universite'],
    glyph: (x) => 1.8 * Math.exp(-4 * x * x) - 0.8,
    load: () => import('./probability-monte-carlo'),
  },
  {
    id: 'limit-epsilon-delta',
    title: 'Limit & Süreklilik',
    subtitle: 'ε–δ kutusu ve süreksizlik türleri',
    tier: 1,
    level: ['lise', 'universite'],
    glyph: (x) => (Math.abs(x) < 0.05 ? NaN : Math.sin(3 * x) / (3 * x)),
    load: () => import('./limit-epsilon-delta'),
  },
  // Kademe 2
  {
    id: 'linear-transformations',
    title: 'Lineer Dönüşümler',
    subtitle: 'Matrisler ızgarayı nasıl büker, determinant ne ölçer',
    tier: 2,
    level: ['universite'],
    glyph: (x) => 0.7 * x,
    load: () => import('./linear-transformations'),
  },
  { id: 'vectors', title: 'Vektörler', subtitle: 'Toplama, izdüşüm, skaler ve vektörel çarpım', tier: 2, level: ['lise', 'universite'], glyph: (x) => -0.5 * x + 0.2, load: () => import('./vectors') },
  {
    id: 'complex-numbers',
    title: 'Karmaşık Sayılar',
    subtitle: 'Çarpma = döndürme + ölçekleme, De Moivre',
    tier: 2,
    level: ['lise', 'universite'],
    glyph: (x) => Math.sqrt(Math.max(0, 1 - x * x)) * Math.sign(Math.sin(x * 9)),
    load: () => import('./complex-numbers'),
  },
  { id: 'sequences-series', title: 'Diziler & Seriler', subtitle: 'Kısmi toplamlar ve yakınsaklık', tier: 2, level: ['lise', 'universite'], glyph: (x) => 1 - Math.pow(0.5, Math.floor((x + 1) * 4)), load: () => import('./sequences-series') },
  { id: 'exponential-log', title: 'Üstel & Logaritma', subtitle: 'Faiz, nüfus artışı, radyoaktif bozunma', tier: 2, level: ['lise'], glyph: (x) => Math.exp(1.6 * x) / 2.5 - 0.8, load: () => import('./exponential-log') },
  { id: 'statistics-clt', title: 'İstatistik', subtitle: 'Merkezi limit teoremi ve normal dağılım', tier: 2, level: ['lise', 'universite'], glyph: (x) => 1.7 * Math.exp(-6 * x * x) - 0.8, load: () => import('./statistics-clt') },
  // Kademe 3
  { id: 'taylor-series', title: 'Taylor Serisi', subtitle: 'Terim ekledikçe fonksiyona yaklaşan polinomlar', tier: 3, level: ['universite'], glyph: (x) => Math.sin(3 * x) * 0.9, load: () => import('./taylor-series') },
  {
    id: 'fourier-series',
    title: 'Fourier Serileri',
    subtitle: 'Dönen çemberlerle her şekli çiz',
    tier: 3,
    level: ['universite'],
    glyph: (x) => 0.8 * (Math.sin(6 * x) + Math.sin(18 * x) / 3 + Math.sin(30 * x) / 5),
    load: () => import('./fourier-series'),
  },
  { id: 'differential-equations', title: 'Diferansiyel Denklemler', subtitle: 'Yön alanı, Euler/RK4, av-avcı, SIR', tier: 3, level: ['universite'], glyph: (x) => Math.exp(-x - 1) * Math.cos(8 * x), load: () => import('./differential-equations') },
  { id: 'multivariable-calculus', title: 'Çok Değişkenli Calculus', subtitle: '3D yüzey, gradyan ve gradient descent', tier: 3, level: ['universite'], glyph: (x) => Math.cos(4 * x) * Math.exp(-x * x), load: () => import('./multivariable-calculus') },
  { id: 'conics', title: 'Konikler', subtitle: 'Odak, doğrultman ve yansıma özelliği', tier: 3, level: ['lise', 'universite'], glyph: (x) => 0.6 * Math.sqrt(1 + 3 * x * x) - 0.9, load: () => import('./conics') },
  { id: 'numerical-methods', title: 'Sayısal Yöntemler', subtitle: 'Newton-Raphson ve ikiye bölme yarışı', tier: 3, level: ['universite'], glyph: (x) => x * x * x - 0.4 * x, load: () => import('./numerical-methods') },
  // Bonus
  { id: 'regression', title: 'Regresyon', subtitle: 'Noktaları sürükle, en küçük kareler doğrusu', tier: 4, level: ['universite'], glyph: (x) => 0.6 * x + 0.25 * Math.sin(11 * x), load: () => import('./regression') },
  { id: 'graph-theory', title: 'Graf Teorisi', subtitle: 'BFS ve Dijkstra animasyonu', tier: 4, level: ['universite'], glyph: (x) => (Math.abs(Math.sin(5 * x)) > 0.5 ? 0.5 : -0.5), load: () => import('./graph-theory') },
];

export const findTopic = (id: string | undefined) => CATALOG.find((t) => t.id === id);

const cache = new Map<string, Promise<SimulationModule>>();

/** Modülü bir kez yükler ve önbellekte tutar. */
export function loadTopic(entry: TopicEntry): Promise<SimulationModule> | null {
  if (!entry.load) return null;
  let p = cache.get(entry.id);
  if (!p) {
    p = entry.load().then((m) => m.default);
    cache.set(entry.id, p);
  }
  return p;
}
