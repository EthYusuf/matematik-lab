import { fmt, tex } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { describe, POPULATIONS, sampleMeans } from './model';
import { CltSimulation, cltState } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'dist',
    label: 'Nüfus dağılımı',
    default: 'exponential',
    options: Object.entries(POPULATIONS).map(([value, p]) => ({ value, label: p.label })),
  },
  { kind: 'slider', key: 'n', label: 'Örneklem büyüklüğü n', min: 1, max: 50, step: 1, default: 1, tone: '--c-fn', format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 'm', label: 'Örneklem sayısı', min: 10, max: 5000, step: 1, default: 1500, scale: 'log', tone: '--c-pt', format: (v) => fmt(Math.round(v), 0) },
  { kind: 'toggle', key: 'showNormal', label: 'Kuramsal normal eğri', default: true },
  { kind: 'value', key: 'seed', default: 1 },
];

const observed = (p: Record<string, unknown>) => {
  const { pop, n, m, seed } = cltState(p);
  return { pop, n, m, ...describe(sampleMeans(pop, n, m, seed)) };
};

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Çarpık bir nüfus',
    body: `Alt panel **nüfusu** gösteriyor: üstel dağılım, sağa doğru uzun kuyruklu ve çok çarpık (ör. bekleme süreleri).

Üstteki histogram: nüfustan **n** elemanlı örneklemler alıp her birinin **ortalamasını** hesaplıyoruz. n = 1 iken histogram nüfusun kendisine benzer.`,
    scene: { patch: { dist: 'exponential', n: 1, m: 1500, showNormal: false } },
    sceneLabel: 'n = 1 ile başla',
  },
  {
    kind: 'predict-choice',
    title: 'Ortalamaların şekli',
    question: 'Her örneklem **30** elemanlı olursa, ortalamaların histogramı nasıl görünür?',
    options: ['Nüfus gibi çarpık kalır', 'Simetrik bir çan eğrisine yaklaşır', 'Düz (her değer eşit sıklıkta)', 'İki tepeli olur'],
    correctIndex: 1,
    setup: { dist: 'exponential', n: 1, m: 1500, showNormal: false },
    observe: { patch: { showNormal: true }, animate: { key: 'n', to: 30, durationMs: 3500 } },
    explain:
      '**Merkezi Limit Teoremi**: nüfus nasıl olursa olsun, örneklem ortalamaları n büyüdükçe **normal dağılıma** yaklaşır: $\\bar X \\approx N\\!\\left(\\mu, \\frac{\\sigma^2}{n}\\right)$. İstatistiğin neden her yerde çan eğrisi kullandığının sebebi budur.',
  },
  {
    kind: 'predict-choice',
    title: 'Yayılım',
    question: 'Örneklem büyüklüğü **4 katına** çıkarsa (n: 10 → 40), ortalamaların standart sapması ne olur?',
    options: ['4 katına çıkar', 'Değişmez', 'Yarıya iner', '4\'te birine iner'],
    correctIndex: 2,
    setup: { dist: 'uniform', n: 10, m: 2000, showNormal: true },
    observe: { animate: { key: 'n', to: 40, durationMs: 2500 } },
    explain: '$\\sigma_{\\bar x} = \\dfrac{\\sigma}{\\sqrt n}$: n 4 katına çıkınca $\\sqrt n$ 2 katına çıkar, yayılım **yarıya** iner. İki kat hassasiyet için dört kat veri gerekir!',
  },
  {
    kind: 'explore',
    title: 'Her nüfusta çalışır',
    body: `Nüfusu **iki tepeli** ya da **zar** yap, n'yi artır. Nüfus ne kadar tuhaf olursa olsun ortalamalar çan eğrisine oturur.

Güven aralıkları, anketlerdeki "±%3 hata payı" ve kalite kontrol bu teoreme dayanır.`,
    scene: { patch: { dist: 'bimodal', n: 2, m: 3000, showNormal: true } },
    sceneLabel: 'İki tepeli nüfus',
  },
];

const challenges: Challenge[] = [
  {
    id: 'sd-below',
    setup: { dist: 'uniform', n: 1, m: 1500, showNormal: true },
    prompt: '**Düzgün** dağılımda (en az 500 örneklemle) ortalamaların gözlenen standart sapması **0,1**\'in altına insin.',
    check: (p) => {
      if (str(p, 'dist') !== 'uniform') return false;
      const o = observed(p);
      return o.m >= 500 && o.sd < 0.1;
    },
    hints: ['$\\sigma = \\sqrt{1/12} \\approx 0{,}289$', '$0{,}289/\\sqrt n < 0{,}1 \\Rightarrow n \\ge 9$'],
  },
  {
    id: 'dice-quarter',
    setup: { dist: 'dice', n: 1, m: 1500, showNormal: true },
    prompt: '**Zar** için ortalamaların kuramsal standart sapması $\\sigma/\\sqrt n$ **0,25** olsun (±0,02).',
    check: (p) => {
      const { pop, n } = cltState(p);
      return str(p, 'dist') === 'dice' && Math.abs(pop.sigma / Math.sqrt(n) - 0.25) < 0.02;
    },
    hints: ['Zarın standart sapması $\\sqrt{35/12} \\approx 1{,}708$.', '$\\sqrt n = 1{,}708 / 0{,}25 \\approx 6{,}8 \\Rightarrow n \\approx 47$'],
  },
  {
    id: 'mean-precise',
    setup: { dist: 'exponential', n: 1, m: 200, showNormal: true },
    prompt: '**Üstel** dağılımda (μ = 1) ortalamaların ortalaması 1\'e **0,01**\'den yakın olsun.',
    check: (p) => str(p, 'dist') === 'exponential' && Math.abs(observed(p).mean - 1) < 0.01,
    hints: ['Toplam veri sayısı $n \\times$ örneklem sayısı arttıkça tahmin keskinleşir.', 'n = 30 ve 5000 örneklem dene.'],
  },
];

export const cltModule: SimulationModule = {
  id: 'statistics-clt',
  params,
  Component: CltSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { pop, n } = cltState(p);
    return `\\begin{aligned}&\\bar X \\approx N\\!\\left(\\mu,\\ \\frac{\\sigma^2}{n}\\right) \\\\[3pt]&\\sigma_{\\bar x} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${tex(pop.sigma, 3)}}{\\sqrt{${n}}} = ${tex(pop.sigma / Math.sqrt(n), 4)}\\end{aligned}`;
  },
  readouts: (p) => {
    const o = observed(p);
    return [
      { label: 'Nüfus μ / σ', value: `${fmt(o.pop.mu, 3)} / ${fmt(o.pop.sigma, 3)}`, tone: '--c-hot' },
      { label: 'Ortalamaların ortalaması', value: fmt(o.mean, 4), tone: '--c-fn' },
      { label: 'Ortalamaların std. sapması', value: fmt(o.sd, 4), tone: '--c-fn' },
      { label: 'Kuramsal σ/√n', value: fmt(o.pop.sigma / Math.sqrt(o.n), 4), tone: '--c-hot' },
      { label: 'Çarpıklık', value: fmt(o.skew, 3) },
    ];
  },
};

export default cltModule;
