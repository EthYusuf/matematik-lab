import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { partialSums, seriesOf } from './model';
import { SeriesSimulation } from './Simulation';

const isGeo = (p: ParamState) => str(p, 'series') === 'geometric';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'series',
    label: 'Seri',
    default: 'geometric',
    options: [
      { value: 'geometric', label: 'Geometrik' },
      { value: 'harmonic', label: 'Harmonik 1/k' },
      { value: 'alternating', label: 'Alterne' },
      { value: 'basel', label: '1/k²' },
    ],
  },
  { kind: 'slider', key: 'a', label: 'İlk terim a', min: 0.5, max: 3, step: 0.5, default: 1, visibleWhen: isGeo, tone: '--c-fn' },
  { kind: 'slider', key: 'r', label: 'Ortak çarpan r', min: -1.2, max: 1.2, step: 0.01, default: 0.5, visibleWhen: isGeo, tone: '--c-hot' },
  { kind: 'slider', key: 'N', label: 'Terim sayısı n', min: 1, max: 100, step: 1, default: 6, tone: '--c-pt', format: (v) => String(Math.round(v)) },
];

const SN = (p: ParamState) => {
  const s = seriesOf(p);
  const N = Math.max(1, Math.round(num(p, 'N')));
  return { s, N, value: partialSums(s.term, N)[N - 1] };
};

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Sonsuz toplam',
    body: `$\\frac12 + \\frac14 + \\frac18 + \\dots$ — sonsuz sayıda terim topluyoruz. Sonuç sonsuz mu olur?

Grafik **kısmi toplamları** $S_n$ (ilk n terimin toplamı) gösteriyor. Alttaki sayı doğrusunda her yay bir terim: zıplamalar giderek küçülüyor.`,
    scene: { patch: { series: 'geometric', a: 1, r: 0.5, N: 6 } },
    sceneLabel: 'Geometrik seriyi kur',
  },
  {
    kind: 'predict-number',
    title: 'Toplam kaç?',
    question: '$1 + \\frac12 + \\frac14 + \\frac18 + \\dots$ sonsuz toplamı kaçtır?',
    answer: 2,
    tolerance: 0.01,
    setup: { series: 'geometric', a: 1, r: 0.5, N: 3 },
    observe: { animate: { key: 'N', to: 40, durationMs: 3000 } },
    explain:
      'Her adımda kalan yolun **yarısını** gidiyoruz: 2\'ye hiç ulaşmadan sonsuz yaklaşıyoruz. Formül: $S = \\dfrac{a}{1 - r} = \\dfrac{1}{1 - \\frac12} = 2$. Sonsuz terimin toplamı **sonlu** olabilir!',
  },
  {
    kind: 'predict-choice',
    title: 'Harmonik seri',
    question: 'Terimler sıfıra gidiyor: $1 + \\frac12 + \\frac13 + \\frac14 + \\dots$ toplamı sonlu mudur?',
    options: ['Evet, yaklaşık 2\'dir', 'Evet, yaklaşık 3\'tür', 'Hayır, yavaşça sonsuza gider', 'Terimler sıfıra gittiği için toplam 0\'dır'],
    correctIndex: 2,
    setup: { series: 'harmonic', N: 5 },
    observe: { animate: { key: 'N', to: 100, durationMs: 3500 } },
    explain:
      'Şaşırtıcı ama **ıraksar**: $\\frac13 + \\frac14 > \\frac12$, $\\frac15 + \\dots + \\frac18 > \\frac12$, … sonsuz tane ½ birikir. Terimlerin sıfıra gitmesi yakınsaklık için **yetmez**. ($S_{100} \\approx 5{,}19$, $S_{10^{43}} \\approx 100$!)',
  },
  {
    kind: 'predict-choice',
    title: 'r büyürse',
    question: 'Geometrik seride $r = 1{,}1$ olursa ne olur?',
    options: ['Toplam 11\'e yakınsar', 'Toplam sonsuza gider', 'Toplam 0\'a gider', 'Salınır ama yakınsar'],
    correctIndex: 1,
    setup: { series: 'geometric', a: 1, r: 0.9, N: 30 },
    observe: { patch: { r: 1.1 }, animate: { key: 'N', to: 60, durationMs: 2500 } },
    explain: 'Geometrik seri yalnızca $|r| < 1$ iken yakınsar. $r \\ge 1$ ise terimler küçülmez ve toplam sınırsız büyür; $r \\le -1$ ise salınarak dağılır.',
  },
  {
    kind: 'explore',
    title: 'Basel problemi',
    body: `$1 + \\frac14 + \\frac19 + \\frac1{16} + \\dots$ — Euler bu toplamın $\\dfrac{\\pi^2}{6} \\approx 1{,}6449$ olduğunu 1734'te kanıtladı. Kareler toplamında **π** ortaya çıkıyor!

Alterne harmonik seri ise işaretler değiştiği için yakınsar: $1 - \\frac12 + \\frac13 - \\dots = \\ln 2$. Sayı doğrusunda ileri-geri zıplamayı izle.`,
    scene: { patch: { series: 'alternating', N: 30 } },
    sceneLabel: 'Alterne seriyi göster',
  },
];

const challenges: Challenge[] = [
  {
    id: 'geo-three',
    setup: { series: 'geometric', a: 1, r: 0.5, N: 10 },
    prompt: 'Sonsuz toplamı tam olarak **3** olan bir geometrik seri kur.',
    check: (p) => {
      const s = seriesOf(p);
      return isGeo(p) && s.limit !== null && Math.abs(s.limit - 3) < 0.02;
    },
    hints: ['$\\dfrac{a}{1 - r} = 3$ olmalı.', '$a = 1{,}5$ ve $r = 0{,}5$ dene — ya da $a = 1$, $r \\approx 0{,}67$.'],
  },
  {
    id: 'harmonic-four',
    setup: { series: 'harmonic', N: 5 },
    prompt: 'Harmonik seride kısmi toplam **4**\'ü geçsin. Bunun için en az kaç terim gerekir?',
    check: (p) => str(p, 'series') === 'harmonic' && SN(p).value > 4,
    hints: ['n\'yi yavaşça artır; büyüme çok yavaştır.', '$H_n \\approx \\ln n + 0{,}577$'],
  },
  {
    id: 'alt-ln2',
    setup: { series: 'alternating', N: 5 },
    prompt: 'Alterne harmonik seride $S_n$\'i $\\ln 2$\'ye **0,01**\'den yakın getir.',
    check: (p) => str(p, 'series') === 'alternating' && Math.abs(SN(p).value - Math.LN2) < 0.01,
    hints: ['Alterne serilerde hata, atlanan ilk terimden küçüktür: $\\frac{1}{n+1}$.', 'n ≈ 50 gerekir.'],
  },
];

export const seriesModule: SimulationModule = {
  id: 'sequences-series',
  params,
  Component: SeriesSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { s, N, value } = SN(p);
    const geo = isGeo(p) ? `\\quad (a = ${tex(num(p, 'a'))},\\ r = ${tex(num(p, 'r'))})` : '';
    return `\\begin{aligned}&${s.tex} = ${s.limitTex}${geo}\\\\[3pt]&S_{${N}} = ${tex(value, 5)}${s.limit !== null ? ` \\to ${tex(s.limit, 5)}` : ''}\\end{aligned}`;
  },
  readouts: (p) => {
    const { s, N, value } = SN(p);
    return [
      { label: `aₙ (n = ${N})`, value: fmt(s.term(N), 5), tone: '--c-fn' },
      { label: 'Sₙ', value: fmt(value, 5), tone: '--c-pt' },
      { label: 'Limit', value: s.limit !== null ? fmt(s.limit, 5) : 'yok (∞)', tone: '--c-hot' },
      { label: 'Kalan |S − Sₙ|', value: s.limit !== null ? fmt(Math.abs(s.limit - value), 5) : '—' },
      { label: 'Durum', value: s.limit !== null ? 'yakınsak' : 'ıraksak' },
    ];
  },
};

export default seriesModule;
