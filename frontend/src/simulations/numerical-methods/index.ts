import { fmt, tex } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { numState, PROBLEMS } from './model';
import { NumericalSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'fn',
    label: 'Denklem f(x) = 0',
    default: 'sqrt2',
    options: Object.entries(PROBLEMS).map(([value, p]) => ({ value, label: p.label })),
  },
  {
    kind: 'select',
    key: 'method',
    label: 'Yöntem',
    default: 'both',
    options: [
      { value: 'newton', label: 'Newton' },
      { value: 'bisection', label: 'İkiye bölme' },
      { value: 'both', label: 'İkisi' },
    ],
  },
  { kind: 'slider', key: 'k', label: 'Adım sayısı k', min: 0, max: 12, step: 1, default: 0, tone: '--c-pt', format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 'x0', label: 'Newton başlangıcı x₀', min: -1, max: 3.5, step: 0.05, default: 3, tone: '--c-hot' },
];

const digits = (err: number) => (err <= 0 ? 16 : Math.max(0, Math.min(16, Math.floor(-Math.log10(err)))));

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Teğet boyunca kaymak',
    body: `$x^2 - 2 = 0$'ın kökü $\\sqrt2$. Ama hesap makinesi bunu nasıl bulur?

**Newton yöntemi**: bulunduğun noktada teğeti çiz, teğetin x eksenini kestiği yere atla, tekrarla:

$$x_{k+1} = x_k - \\frac{f(x_k)}{f'(x_k)}$$

**adım at**'a bas ve kırmızı zikzakları izle.`,
    scene: { patch: { fn: 'sqrt2', method: 'newton', k: 0, x0: 3 } },
    sceneLabel: 'Newton ile başla',
  },
  {
    kind: 'predict-choice',
    title: 'Hız',
    question: 'Köke yaklaştıkça Newton her adımda doğru basamak sayısını yaklaşık ne yapar?',
    options: ['1 artırır', 'İkiye katlar', 'Değiştirmez', 'Yarıya indirir'],
    correctIndex: 1,
    setup: { fn: 'sqrt2', method: 'both', k: 0, x0: 1 },
    observe: { animate: { key: 'k', to: 6, durationMs: 3000 } },
    explain: 'Kırmızı hata eğrisi giderek dikleşen bir uçurum: 1 → 2 → 5 → 12 doğru basamak. Bu **karesel yakınsamadır**. Mavi (ikiye bölme) ise sabit eğimle, her adımda yalnızca ~0,3 basamak kazanır.',
  },
  {
    kind: 'explore',
    title: 'İkiye bölme',
    body: `Daha basit ama garantili yöntem: $f(a)$ ve $f(b)$ zıt işaretliyse arada kök vardır (ara değer teoremi). Aralığı ortadan böl, işaretin değiştiği yarıyı tut.

Mavi çubuklar her adımdaki aralık. Yavaş ama **asla kaçmaz**.`,
    scene: { patch: { fn: 'cosx', method: 'bisection', k: 4 } },
    sceneLabel: 'cos x = x için göster',
  },
  {
    kind: 'predict-number',
    title: 'Aralık genişliği',
    question: '$[1, 2]$ aralığında ikiye bölmeyle **10 adım** sonra aralığın genişliği kaçtır? (kesir yazabilirsin)',
    answer: 1 / 1024,
    tolerance: 0.00005,
    setup: { fn: 'sqrt2', method: 'bisection', k: 0 },
    observe: { animate: { key: 'k', to: 10, durationMs: 3000 } },
    explain: 'Her adım aralığı yarıya indirir: $\\frac{1}{2^{10}} = \\frac{1}{1024} \\approx 0{,}001$. Yaklaşık 3,3 adımda bir doğru basamak.',
  },
  {
    kind: 'predict-choice',
    title: 'Newton ne zaman çuvallar?',
    question: 'Başlangıç noktasında teğet **yataya yakınsa** ($f\'(x_0) \\approx 0$) Newton ne yapar?',
    options: ['Hemen köke gider', 'Çok uzağa fırlar; yavaşlar ya da başka yere gider', 'Durur', 'İkiye bölmeye dönüşür'],
    correctIndex: 1,
    setup: { fn: 'cubic', method: 'newton', k: 0, x0: 3 },
    observe: { patch: { x0: 0.8 }, animate: { key: 'k', to: 6, durationMs: 2800 } },
    explain: 'Neredeyse yatay teğet, x eksenini çok uzakta keser: ilk adım −75\'e fırladı! Newton hızlıdır ama **iyi bir başlangıç** ister. Pratikte önce ikiye bölmeyle yaklaşılır, sonra Newton ile bitirilir.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'sqrt2-four',
    setup: { fn: 'sqrt2', method: 'newton', k: 0, x0: 3 },
    prompt: '$\\sqrt2$\'yi Newton ile **en fazla 4 adımda** $10^{-6}$ hassasiyetle bul.',
    check: (p) => {
      const st = numState(p);
      return str(p, 'fn') === 'sqrt2' && st.method !== 'bisection' && st.k <= 4 && Math.abs(st.newtonX - Math.SQRT2) < 1e-6;
    },
    hints: ['Başlangıç ne kadar yakınsa o kadar iyi.', '$x_0 = 1$ ya da $1{,}5$ dene, 4 adım at.'],
  },
  {
    id: 'slow-newton',
    setup: { fn: 'cubic', method: 'newton', k: 0, x0: 3 },
    prompt: '$x^3 - 2x - 5$ için Newton\'u **yavaşlat**: öyle bir $x_0$ seç ki 6 adımdan sonra hata hâlâ **0,1**\'den büyük olsun.',
    check: (p) => {
      const st = numState(p);
      return str(p, 'fn') === 'cubic' && st.method !== 'bisection' && st.k >= 6 && Math.abs(st.newtonX - st.root) > 0.1;
    },
    hints: ["$f'(x) = 3x^2 - 2$ nerede sıfıra yakın?", '$x_0 \\approx \\pm 0{,}8$ civarı.'],
  },
  {
    id: 'bisect-precise',
    setup: { fn: 'cosx', method: 'bisection', k: 0 },
    prompt: '$\\cos x = x$ kökünü ikiye bölmeyle **0,001 genişliğinden dar** bir aralığa hapset.',
    check: (p) => {
      const st = numState(p);
      return str(p, 'fn') === 'cosx' && st.method !== 'newton' && st.width < 0.001;
    },
    hints: ['Başlangıç aralığı [0, 1].', '$2^{-k} < 0{,}001 \\Rightarrow k \\ge 10$'],
  },
];

export const numericalModule: SimulationModule = {
  id: 'numerical-methods',
  params,
  Component: NumericalSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const st = numState(p);
    return `\\begin{aligned}&f(x) = ${st.prob.tex} \\\\[3pt]&x_{k+1} = x_k - \\frac{f(x_k)}{f'(x_k)},\\quad x_{${st.k}} = ${tex(st.newtonX, 8)}\\end{aligned}`;
  },
  readouts: (p) => {
    const st = numState(p);
    const ne = Math.abs(st.newtonX - st.root);
    const be = Math.abs(st.bisX - st.root);
    return [
      { label: 'Gerçek kök', value: fmt(st.root, 10), tone: '--c-tan' },
      { label: `Newton xₖ (k = ${st.k})`, value: fmt(st.newtonX, 10), tone: '--c-hot' },
      { label: 'Newton doğru basamak', value: String(digits(ne)), tone: '--c-hot' },
      { label: 'İkiye bölme orta nokta', value: fmt(st.bisX, 10), tone: '--c-fn' },
      { label: 'Aralık genişliği', value: fmt(st.width, 8), tone: '--c-fn' },
      { label: 'İkiye bölme basamak', value: String(digits(be)), tone: '--c-fn' },
    ];
  },
};

export default numericalModule;
