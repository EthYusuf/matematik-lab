import { fmt, tex } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { COMPOUNDING, modelOf } from './model';
import { ExpSimulation } from './Simulation';

const isInterest = (p: ParamState) => str(p, 'model') !== 'decay';
const pct = (v: number) => `%${fmt(v * 100, 1)}`;

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'model',
    label: 'Model',
    default: 'interest',
    options: [
      { value: 'interest', label: 'Büyüme / faiz' },
      { value: 'decay', label: 'Radyoaktif bozunma' },
    ],
  },
  { kind: 'slider', key: 'P', label: 'Başlangıç miktarı', min: 100, max: 2000, step: 100, default: 1000, tone: '--c-fn', format: (v) => fmt(v, 0) },
  { kind: 'slider', key: 'r', label: 'Yıllık oran r', min: 0, max: 0.5, step: 0.001, default: 0.1, tone: '--c-hot', format: pct, visibleWhen: isInterest },
  {
    kind: 'select',
    key: 'comp',
    label: 'Bileşik dönemi',
    default: '1',
    options: COMPOUNDING.map((c) => ({ value: c.value, label: c.label })),
    visibleWhen: isInterest,
  },
  { kind: 'slider', key: 'T', label: 'Yarı ömür T (yıl)', min: 1, max: 20, step: 0.1, default: 5, tone: '--c-pt', visibleWhen: (p) => !isInterest(p) },
  { kind: 'slider', key: 't', label: 'Zaman t (yıl)', min: 0, max: 30, step: 0.5, default: 10, tone: '--c-pt' },
  { kind: 'toggle', key: 'logScale', label: 'Logaritmik y ekseni', default: false },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Faizin faizi',
    body: `1000 TL'yi yıllık %10 faizle yatırırsan, ikinci yıl faiz yalnızca 1000'e değil **1100'e** işler. Para her yıl kendisiyle orantılı büyür: **üstel büyüme**.

$$A(t) = P\\left(1 + \\frac{r}{n}\\right)^{nt}$$

t noktasını sürükle; eğrinin giderek dikleştiğini gör.`,
    scene: { patch: { model: 'interest', P: 1000, r: 0.1, comp: '1', t: 10, logScale: false } },
    sceneLabel: '%10 yıllık faiz',
  },
  {
    kind: 'predict-choice',
    title: 'Daha sık faiz',
    question: 'Aynı %100 yıllık faiz yılda bir kez yerine **her gün** eklenirse, 1 TL bir yıl sonunda ne olur?',
    options: ['Tam 2 TL olur', 'Biraz daha fazla: yaklaşık 2,71 TL', '365 kat büyür', 'Sonsuz olur'],
    correctIndex: 1,
    setup: { model: 'interest', P: 1000, r: 0.5, comp: '1', t: 2, logScale: false },
    observe: { patch: { comp: '365' } },
    explain:
      'Sıklık arttıkça kazanç artar ama **sınırlıdır**: $\\left(1 + \\frac1n\\right)^n \\to e \\approx 2{,}718$. Sürekli bileşik faiz $P\\,e^{rt}$ formülünü verir — doğadaki büyümenin (bakteri, nüfus) dili budur.',
  },
  {
    kind: 'predict-number',
    title: 'e sayısı',
    question: '%100 oranla **sürekli** bileşik faizde 1 TL, 1 yıl sonra kaç TL olur? (2 ondalık)',
    answer: Math.E,
    tolerance: 0.01,
    setup: { model: 'interest', P: 1000, r: 0.1, comp: '1', t: 1 },
    observe: { patch: { r: 0.5, comp: 'cont', t: 2 } },
    explain: '$e^{1} \\approx 2{,}718$. Grafikte $r = 0{,}5$ ve $t = 2$ gösteriliyor: $rt = 1$ olduğu için $1000\\,e^{1} \\approx 2718$.',
  },
  {
    kind: 'predict-number',
    title: 'Yarı ömür',
    question: 'Yarı ömrü 5 yıl olan 800 g radyoaktif maddeden 15 yıl sonra kaç gram kalır?',
    answer: 100,
    tolerance: 0.5,
    setup: { model: 'decay', P: 800, T: 5, t: 0, logScale: false },
    observe: { animate: { key: 't', to: 15, durationMs: 2600 } },
    explain: '15 yıl = 3 yarı ömür: $800 \\to 400 \\to 200 \\to 100$. Formül: $m(t) = m_0 \\left(\\frac12\\right)^{t/T}$. Karbon-14 ile yaş tayini tam olarak budur (T ≈ 5730 yıl).',
  },
  {
    kind: 'explore',
    title: 'Logaritma: üsteli düzleştir',
    body: `Logaritma üstel fonksiyonun **tersidir**: $\\log_{10}(1000) = 3$ çünkü $10^3 = 1000$.

y eksenini logaritmik yapınca üstel eğri **doğruya** dönüşür: her eşit zaman aralığında aynı **oranla** büyüdüğü için. Bilim insanları üstel veriyi (salgın, deprem, ses) bu yüzden log ölçekte çizer.`,
    scene: { patch: { model: 'interest', P: 100, r: 0.3, comp: 'cont', t: 20, logScale: true } },
    sceneLabel: 'Log ölçeği aç',
  },
];

const challenges: Challenge[] = [
  {
    id: 'double-ten',
    setup: { model: 'interest', P: 1000, r: 0.1, comp: '1', t: 10, logScale: false },
    prompt: '**Yıllık** bileşik faizle paranın **10 yılda ikiye** katlanacağı faiz oranını bul.',
    check: (p) => {
      const m = modelOf(p);
      return isInterest(p) && str(p, 'comp') === '1' && Math.abs((1 + m.r) ** 10 - 2) < 0.03;
    },
    hints: ['$(1 + r)^{10} = 2$', '$r = 2^{0{,}1} - 1 \\approx \\%7{,}2$ — "72 kuralı": 72 / oran ≈ katlanma süresi.'],
  },
  {
    id: 'eighth-twenty',
    setup: { model: 'decay', P: 1000, T: 5, t: 20, logScale: false },
    prompt: 'Yarı ömrü öyle ayarla ki madde **20 yılda başlangıcın 1/8\'ine** insin.',
    check: (p) => {
      const m = modelOf(p);
      return !isInterest(p) && Math.abs(m.f(20) / m.P - 1 / 8) < 0.003;
    },
    hints: ['1/8 = (1/2)³: üç yarı ömür geçmeli.', '$3T = 20 \\Rightarrow T \\approx 6{,}7$'],
  },
  {
    id: 'pop-5000',
    setup: { model: 'interest', P: 1000, r: 0.1, comp: 'cont', t: 10, logScale: false },
    prompt: 'Sürekli büyümede 1000\'den başlayan nüfus **10 yılda 5000**\'e ulaşsın (±25).',
    check: (p) => {
      const m = modelOf(p);
      return isInterest(p) && str(p, 'comp') === 'cont' && m.P === 1000 && Math.abs(m.f(10) - 5000) < 25;
    },
    hints: ['$1000\\,e^{10r} = 5000 \\Rightarrow e^{10r} = 5$', '$r = \\dfrac{\\ln 5}{10} \\approx 0{,}161$'],
  },
];

export const expModule: SimulationModule = {
  id: 'exponential-log',
  params,
  Component: ExpSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const m = modelOf(p);
    if (m.kind === 'decay') return `m(t) = ${tex(m.P, 0)}\\left(\\tfrac12\\right)^{t/${tex(m.T, 1)}}`;
    if (!Number.isFinite(m.n)) return `A(t) = ${tex(m.P, 0)}\\,e^{${tex(m.r, 3)}\\,t}`;
    if (m.n === 1) return `A(t) = ${tex(m.P, 0)}\\,(1 + ${tex(m.r, 3)})^{t}`;
    return `A(t) = ${tex(m.P, 0)}\\left(1 + \\frac{${tex(m.r, 3)}}{${m.n}}\\right)^{${m.n}t}`;
  },
  readouts: (p) => {
    const m = modelOf(p);
    const t = Number(p.t);
    const rows = [
      { label: `Değer (t = ${fmt(t, 1)})`, value: fmt(m.f(t), 2), tone: '--c-fn' },
      { label: 'Başlangıç', value: fmt(m.P, 0) },
    ];
    if (m.kind === 'decay') return [...rows, { label: 'Kalan oran', value: `%${fmt((m.f(t) / m.P) * 100, 2)}`, tone: '--c-pt' }, { label: 'Bozunma sabiti k', value: fmt(Math.LN2 / m.T, 4) }];
    const eff = Number.isFinite(m.n) ? (1 + m.r / m.n) ** m.n - 1 : Math.exp(m.r) - 1;
    return [
      ...rows,
      { label: 'Efektif yıllık oran', value: pct(eff), tone: '--c-hot' },
      { label: 'İkiye katlanma', value: Number.isFinite(m.characteristic) ? `${fmt(m.characteristic, 2)} yıl` : '—', tone: '--c-pt' },
    ];
  },
};

export default expModule;
