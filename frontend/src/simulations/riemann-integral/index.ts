import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { INTEGRANDS, integralState, RULE_LABELS } from './model';
import { IntegralSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'fn',
    label: 'Fonksiyon f(x)',
    default: 'square',
    options: Object.entries(INTEGRANDS).map(([value, f]) => ({ value, label: f.label })),
  },
  {
    kind: 'select',
    key: 'rule',
    label: 'Yükseklik kuralı',
    default: 'left',
    options: Object.entries(RULE_LABELS).map(([value, label]) => ({ value, label })),
  },
  { kind: 'slider', key: 'n', label: 'Parça sayısı n', min: 1, max: 100, step: 1, default: 4, tone: '--c-fn', format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 'a', label: 'Alt sınır a', min: 0, max: 1.9, step: 0.01, default: 0 },
  { kind: 'slider', key: 'b', label: 'Üst sınır b', min: 2, max: 4, step: 0.01, default: 2 },
  { kind: 'toggle', key: 'showExact', label: 'Gerçek alanı göster', default: false },
];

const BASE = { fn: 'square', a: 0, b: 2, n: 4, rule: 'left', showExact: false };

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Alanı dikdörtgenlerle ölç',
    body: `Eğri altındaki alanı doğrudan ölçemeyiz, ama **dikdörtgenlerin** alanını biliriz.

$[a, b]$ aralığını $n$ eşit parçaya böl; her parçanın genişliği $\\Delta x = \\dfrac{b-a}{n}$. Her dikdörtgenin yüksekliği, fonksiyonun o parçadaki bir değeridir.

Alanların toplamına **Riemann toplamı** denir.`,
    scene: { patch: BASE },
    sceneLabel: 'Başlangıca kur',
  },
  {
    kind: 'predict-choice',
    title: 'Sol uç noktası kuralı',
    question: '$x^2$ artan bir fonksiyon. Her dikdörtgenin yüksekliğini **sol** uçtan alırsak toplam, gerçek alana göre nasıl olur?',
    options: ['Gerçek alandan küçük', 'Gerçek alandan büyük', 'Tam olarak eşit', 'Duruma göre değişir'],
    correctIndex: 0,
    setup: BASE,
    observe: { patch: { showExact: true } },
    explain:
      'Artan fonksiyonda sol uç, parçanın **en alçak** noktasıdır; her dikdörtgen eğrinin altında kalır. Yeşil gerçek alanın bir kısmı dikdörtgenlerin dışında kaldı: toplam **eksik** ölçer. Sağ uç kuralı ise tam tersine fazla ölçer.',
  },
  {
    kind: 'predict-choice',
    title: 'Daha çok parça',
    question: 'n\'yi 4\'ten 100\'e çıkarırsak (sol kural) hata ne olur?',
    options: ['Değişmez', 'Yaklaşık 25 kat küçülür', 'Tam olarak sıfır olur', 'Büyür'],
    correctIndex: 1,
    setup: { ...BASE, showExact: true },
    observe: { animate: { key: 'n', to: 100, durationMs: 3000 } },
    explain:
      'Sol ve sağ kurallarda hata yaklaşık $\\dfrac{1}{n}$ ile orantılıdır: n 25 kat artınca hata da ~25 kat küçülür. Ama **hiçbir sonlu n** için sıfır olmaz — integral, $n \\to \\infty$ limitidir:\n\n$$\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i)\\,\\Delta x$$',
  },
  {
    kind: 'predict-number',
    title: 'Gerçek alanı tahmin et',
    question: '$\\displaystyle\\int_0^2 x^2\\,dx$ kaçtır? (Kesir de yazabilirsin, ör. 5/2)',
    answer: 8 / 3,
    tolerance: 0.02,
    setup: { ...BASE, n: 10 },
    observe: { patch: { rule: 'mid', showExact: true }, animate: { key: 'n', to: 100, durationMs: 2200 } },
    explain:
      'Ters türev $F(x) = \\dfrac{x^3}{3}$ olduğundan $\\int_0^2 x^2\\,dx = F(2) - F(0) = \\dfrac{8}{3} \\approx 2{,}667$. Bu, **Analizin Temel Teoremi**dir: alan, ters türevin uçlardaki farkıdır.',
  },
  {
    kind: 'explore',
    title: 'İşaretli alan',
    body: `$f(x) = 4 - x^2$ fonksiyonu $x = 2$'den sonra x ekseninin **altına** iner. Orada dikdörtgenlerin yüksekliği negatif olur (kırmızı).

İntegral **işaretli alandır**: eksenin üstü pozitif, altı negatif sayılır. b'yi büyüterek pozitif ve negatif alanların nasıl dengelendiğini izle.`,
    scene: { patch: { fn: 'hill', a: 0, b: 3, n: 30, rule: 'mid', showExact: true } },
    sceneLabel: '4 − x² ile göster',
  },
];

const challenges: Challenge[] = [
  {
    id: 'mid-ten',
    setup: BASE,
    prompt: '$x^2$, $[0, 2]$: **orta nokta** kuralıyla, $n \\le 10$ iken hatayı **0,01**\'in altına indir.',
    check: (p) => {
      const s = integralState(p);
      return str(p, 'fn') === 'square' && near(s.a, 0, 1e-9) && near(s.b, 2, 1e-9) && s.rule === 'mid' && s.n <= 10 && Math.abs(s.error) < 0.01;
    },
    hints: ['Sol kural yerine **Orta** kuralını seç.', 'Orta nokta kuralında hata $\\dfrac{1}{n^2}$ gibi azalır; n = 9 veya 10 dene.'],
  },
  {
    id: 'area-nine',
    setup: BASE,
    prompt: '$\\displaystyle\\int_0^b x^2\\,dx = 9$ olacak şekilde **b**\'yi bul.',
    check: (p) => str(p, 'fn') === 'square' && near(num(p, 'a'), 0, 1e-9) && Math.abs(num(p, 'b') ** 3 / 3 - 9) < 0.05,
    hints: ['$\\int_0^b x^2\\,dx = \\dfrac{b^3}{3}$', '$\\dfrac{b^3}{3} = 9 \\Rightarrow b^3 = 27$'],
  },
  {
    id: 'balance',
    setup: { ...BASE, fn: 'hill', rule: 'mid', n: 40, showExact: true },
    prompt: '$4 - x^2$ için $[0, b]$ aralığında integral **0** olsun (±0,05): pozitif ve negatif alanlar dengelensin.',
    check: (p) => {
      const s = integralState(p);
      return str(p, 'fn') === 'hill' && near(s.a, 0, 1e-9) && Math.abs(s.exact) < 0.05;
    },
    hints: ['$F(b) = 4b - \\dfrac{b^3}{3} = 0$ olmalı.', '$b^2 = 12 \\Rightarrow b = \\sqrt{12} \\approx 3{,}46$'],
  },
];

export const integralModule: SimulationModule = {
  id: 'riemann-integral',
  params,
  Component: IntegralSimulation,
  lesson,
  challenges,
  solver: 'integral',
  formula: (p) => {
    const s = integralState(p);
    return `\\begin{aligned}
S_{${s.n}} &= \\sum_{i=1}^{${s.n}} f(x_i^*)\\,\\Delta x = ${tex(s.approx, 4)} \\\\[4pt]
\\int_{${tex(s.a)}}^{${tex(s.b)}} ${s.fn.tex}\\,dx &= \\Big[${s.fn.Ftex}\\Big]_{${tex(s.a)}}^{${tex(s.b)}} = ${tex(s.exact, 4)}
\\end{aligned}`;
  },
  readouts: (p) => {
    const s = integralState(p);
    return [
      { label: 'Δx', value: fmt(s.dx, 4) },
      { label: 'Riemann toplamı', value: fmt(s.approx, 4), tone: '--c-fn' },
      { label: 'Gerçek integral', value: fmt(s.exact, 4), tone: '--c-tan' },
      { label: 'Hata', value: fmt(s.error, 4), tone: '--c-hot' },
      { label: 'Bağıl hata', value: s.exact === 0 ? '—' : `%${fmt(Math.abs(s.error / s.exact) * 100, 2)}` },
    ];
  },
};

export default integralModule;
