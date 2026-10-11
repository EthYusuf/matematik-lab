import { fmt } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { CITIES, cityName, graphState, pathLength, pathTo, trace } from './model';
import { GraphSimulation } from './Simulation';

const cityOptions = CITIES.map((c) => ({ value: c.id, label: c.name }));

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'alg',
    label: 'Algoritma',
    default: 'bfs',
    options: [
      { value: 'bfs', label: 'BFS (genişlik öncelikli)' },
      { value: 'dijkstra', label: 'Dijkstra' },
    ],
  },
  { kind: 'select', key: 'start', label: 'Başlangıç', default: 'istanbul', options: cityOptions },
  { kind: 'select', key: 'target', label: 'Hedef', default: 'konya', options: cityOptions },
  { kind: 'slider', key: 'step', label: 'Adım', min: 0, max: CITIES.length, step: 1, default: 0, tone: '--c-pt', format: (v) => String(Math.round(v)) },
  { kind: 'toggle', key: 'showWeights', label: 'Mesafeleri (km) göster', default: true },
];

const finalPath = (alg: 'bfs' | 'dijkstra', s: string, t: string) => {
  const snaps = trace(alg, s);
  return pathTo(snaps[snaps.length - 1], t);
};

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Şehirler ve yollar',
    body: `Bir **graf**: düğümler (şehirler) ve kenarlar (yollar). Navigasyon uygulamaları, sosyal ağlar ve internet yönlendirme hep graflardır.

**BFS** (genişlik öncelikli arama) başlangıçtan dalga gibi yayılır: önce komşular, sonra komşuların komşuları… **+1 adım** ile ilerle.`,
    scene: { patch: { alg: 'bfs', start: 'istanbul', target: 'konya', step: 1 } },
    sceneLabel: 'BFS başlat',
  },
  {
    kind: 'predict-choice',
    title: 'BFS sırası',
    question: 'İstanbul\'dan başlayan BFS, ilk kesinleşmeden sonra hangi şehirleri işler?',
    options: ['En yakın km\'deki şehri önce', 'İstanbul\'un **tüm komşularını** (Ankara, Bursa, Eskişehir)', 'Rastgele bir şehri', 'En uzak şehri'],
    correctIndex: 1,
    setup: { alg: 'bfs', start: 'istanbul', target: 'konya', step: 1 },
    observe: { animate: { key: 'step', to: 4, durationMs: 2500 } },
    explain: 'BFS katman katman ilerler: 1 kenar uzaklıktakiler, sonra 2 kenar uzaklıktakiler… Kilometreyi **hiç** dikkate almaz; yalnızca kaç yol geçildiğini sayar.',
  },
  {
    kind: 'explore',
    title: 'Dijkstra',
    body: `Dijkstra algoritması her adımda, **toplam mesafesi en küçük** olan kesinleşmemiş şehri seçer ve komşularının mesafelerini günceller.

Böylece her şehre ilk ulaşıldığında bulunan yol, kesinlikle en kısa yoldur. Navigasyon uygulamalarının temelinde (hızlandırılmış hâlleriyle) bu fikir yatar.`,
    scene: { patch: { alg: 'dijkstra', start: 'istanbul', target: 'konya', step: 0 } },
    sceneLabel: 'Dijkstra başlat',
  },
  {
    kind: 'predict-choice',
    title: 'BFS en kısa yolu bulur mu?',
    question: 'Ağırlıklı (km\'li) bir grafta BFS\'in bulduğu yol, km olarak en kısa yol mudur?',
    options: ['Evet, her zaman', 'Hayır: en az **kenarlı** yolu bulur, km olarak daha uzun olabilir', 'Hiçbir yol bulamaz', 'Dijkstra ile aynı yolu bulur'],
    correctIndex: 1,
    setup: { alg: 'bfs', start: 'istanbul', target: 'konya', step: 10 },
    observe: { patch: { alg: 'dijkstra' }, animate: { key: 'step', to: 10, durationMs: 1500 } },
    explain: 'BFS: İstanbul → Ankara → Konya (2 yol, 710 km). Dijkstra: İstanbul → Bursa → Eskişehir → Konya (3 yol ama **645 km**). Az durak her zaman kısa yol değildir!',
  },
  {
    kind: 'predict-number',
    title: 'En kısa mesafe',
    question: 'Haritadaki mesafelerle **İstanbul\'dan Ankara\'ya** en kısa yol kaç km\'dir?',
    answer: 450,
    tolerance: 0.5,
    setup: { alg: 'dijkstra', start: 'istanbul', target: 'ankara', step: 0, showWeights: true },
    observe: { animate: { key: 'step', to: 10, durationMs: 2500 } },
    explain: 'Doğrudan yol 450 km. Eskişehir üzerinden 330 + 235 = 565, Bursa–Eskişehir üzerinden 155 + 150 + 235 = 540 km. Dijkstra hepsini karşılaştırıp 450\'yi seçti.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'izmir-trabzon',
    setup: { alg: 'bfs', start: 'istanbul', target: 'konya', step: 0 },
    prompt: 'Dijkstra ile **İzmir\'den Trabzon\'a** en kısa yolu bul (Trabzon kesinleşene kadar ilerle).',
    check: (p) => {
      const st = graphState(p);
      return st.alg === 'dijkstra' && st.start === 'izmir' && st.target === 'trabzon' && st.snap.done.includes('trabzon');
    },
    hints: ['Algoritmayı Dijkstra, başlangıcı İzmir, hedefi Trabzon yap.', '**sona kadar ▶** ile ilerle.'],
  },
  {
    id: 'bfs-vs-dijkstra',
    setup: { alg: 'bfs', start: 'ankara', target: 'samsun', step: 10 },
    prompt: 'BFS ile Dijkstra\'nın **farklı yollar** bulduğu bir başlangıç–hedef çifti seç (algoritma fark etmez).',
    check: (p) => {
      const s = str(p, 'start');
      const t = str(p, 'target');
      if (s === t) return false;
      return finalPath('bfs', s, t).join() !== finalPath('dijkstra', s, t).join();
    },
    hints: ['Ara durakları az ama kilometresi uzun bir yol ara.', 'İstanbul → Konya iyi bir aday.'],
  },
  {
    id: 'last-city',
    setup: { alg: 'dijkstra', start: 'istanbul', target: 'konya', step: 0 },
    prompt: 'Dijkstra\'da **hedef şehir en son kesinleşen** şehir olsun: başlangıç ve hedefi seç, algoritmayı sonuna kadar çalıştır.',
    check: (p) => {
      const st = graphState(p);
      return st.alg === 'dijkstra' && st.step === st.snaps.length - 1 && st.snap.done[st.snap.done.length - 1] === st.target;
    },
    hints: ['Son kesinleşen şehir, başlangıca en uzak olandır.', 'Trabzon\'dan başlarsan hangi şehir en uzakta?'],
  },
];

export const graphModule: SimulationModule = {
  id: 'graph-theory',
  params,
  Component: GraphSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const st = graphState(p);
    return st.alg === 'bfs'
      ? '\\begin{aligned}&d(v) = d(u) + 1 \\\\[3pt]&\\text{(kuyruk: ilk giren ilk çıkar)}\\end{aligned}'
      : '\\begin{aligned}&d(v) \\leftarrow \\min\\big(d(v),\\ d(u) + w(u, v)\\big) \\\\[3pt]&u = \\arg\\min_{u \\notin S} d(u)\\end{aligned}';
  },
  readouts: (p) => {
    const st = graphState(p);
    const d = st.snap.dist[st.target];
    return [
      { label: 'Adım', value: `${st.step} / ${st.snaps.length - 1}`, tone: '--c-pt' },
      { label: 'Kesinleşen', value: String(st.snap.done.length), tone: '--c-fn' },
      { label: 'Sınırdaki şehirler', value: st.snap.frontier.map(cityName).join(', ') || '—', tone: '--c-hot' },
      { label: `${cityName(st.target)} uzaklığı`, value: Number.isFinite(d) ? (st.alg === 'bfs' ? `${d} adım` : `${fmt(d, 0)} km`) : '∞' },
      { label: 'Bulunan yol', value: st.path.length ? `${fmt(pathLength(st.path), 0)} km` : '—', tone: '--c-tan' },
    ];
  },
};

export default graphModule;
