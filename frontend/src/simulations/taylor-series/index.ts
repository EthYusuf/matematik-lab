import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { TAYLOR_FUNCS, taylorState } from './model';
import { TaylorSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'fn',
    label: 'Fonksiyon',
    default: 'sin',
    options: Object.entries(TAYLOR_FUNCS).map(([value, f]) => ({ value, label: f.label })),
  },
  { kind: 'slider', key: 'N', label: 'Derece N', min: 0, max: 15, step: 1, default: 1, tone: '--c-hot', format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 'a', label: 'Merkez a', min: -2, max: 2, step: 0.5, default: 0, tone: '--c-pt' },
  { kind: 'slider', key: 'x0', label: 'İnceleme noktası x', min: -6.5, max: 6.5, step: 0.05, default: 2, tone: '--ink' },
];

/** P_N'nin ilk birkaç terimini okunur LaTeX olarak yazar. */
function polyTex(coeffs: number[], a: number): string {
  const xa = Math.abs(a) < 1e-12 ? 'x' : a > 0 ? `(x - ${tex(a)})` : `(x + ${tex(-a)})`;
  const terms: string[] = [];
  coeffs.forEach((c, k) => {
    if (Math.abs(c) < 1e-12 || terms.length >= 4) return;
    const mag = Math.abs(c);
    const coef = k > 0 && Math.abs(mag - 1) < 1e-12 ? '' : tex(mag, 4);
    const pow = k === 0 ? '' : k === 1 ? xa : `${xa}^{${k}}`;
    const body = `${coef}${coef && pow ? '\\,' : ''}${pow}` || '1';
    terms.push(terms.length === 0 ? (c < 0 ? `-${body}` : body) : `${c < 0 ? '-' : '+'} ${body}`);
  });
  const more = coeffs.filter((c) => Math.abs(c) > 1e-12).length > 4 ? ' + \\cdots' : '';
  return (terms.join(' ') || '0') + more;
}

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Fonksiyonu polinomla taklit et',
    body: `Hesap makinesi $\\sin(0{,}3)$'ü nasıl bulur? Polinomlarla! Taylor polinomu, fonksiyonun bir noktadaki **değerini, eğimini, bükülmesini…** birebir kopyalayan polinomdur:

$$P_N(x) = \\sum_{k=0}^{N} \\frac{f^{(k)}(a)}{k!}(x-a)^k$$

N = 1 iken bu, teğet doğrusudur: $\\sin x \\approx x$.`,
    scene: { patch: { fn: 'sin', N: 1, a: 0, x0: 0.5 } },
    sceneLabel: 'sin x ≈ x',
  },
  {
    kind: 'predict-choice',
    title: 'Terim ekleyince',
    question: 'Terim sayısını artırdıkça kırmızı polinom ne yapar?',
    options: ['Hiç değişmez', 'Giderek daha geniş bir aralıkta sin x ile çakışır', 'Sadece a noktasında doğru kalır', 'Sonsuza ıraksar'],
    correctIndex: 1,
    setup: { fn: 'sin', N: 1, a: 0, x0: 2 },
    observe: { animate: { key: 'N', to: 15, durationMs: 4000 } },
    explain: 'Her yeni terim, bir türevi daha eşleştirir; yaklaşım merkezden dışarı doğru "fermuar gibi" kapanır. $\\sin x$ için seri **her** x\'te yakınsar (R = ∞).',
  },
  {
    kind: 'predict-number',
    title: 'e sayısını hesapla',
    question: '$e^x$\'in N = 3 Taylor polinomu $1 + x + \\frac{x^2}{2} + \\frac{x^3}{6}$. Bu polinom $x = 1$\'de kaç verir?',
    answer: 8 / 3,
    tolerance: 0.01,
    setup: { fn: 'exp', N: 1, a: 0, x0: 0 },
    observe: { patch: { N: 3, x0: 1 } },
    explain: '$1 + 1 + \\frac12 + \\frac16 = \\frac{8}{3} \\approx 2{,}667$. Gerçek $e \\approx 2{,}718$. Daha fazla terimle $e = \\sum \\frac{1}{k!}$ istediğin hassasiyette hesaplanır.',
  },
  {
    kind: 'explore',
    title: 'Yakınsaklık yarıçapı',
    body: `$\\frac{1}{1-x}$ fonksiyonu $x = 1$'de patlar. a = 0 merkezli serisi $1 + x + x^2 + \\dots$ yalnızca $|x| < 1$ iken yakınsar: yeşil bant.

N'yi artır: bandın içinde yaklaşım mükemmelleşir, **dışında** ise polinom çılgınca sapar. Seri, merkezden en yakın tekilliğe kadar "görür".`,
    scene: { patch: { fn: 'geom', N: 8, a: 0, x0: -0.6 } },
    sceneLabel: '1/(1−x) göster',
  },
  {
    kind: 'predict-choice',
    title: 'ln(1 + x) ve x = 2',
    question: '$\\ln(1+x)$\'in a = 0 merkezli Taylor serisi $x = 2$\'de yakınsar mı?',
    options: ['Evet, her yerde yakınsar', 'Hayır: yakınsaklık yarıçapı 1, x = 2 dışarıda', 'Sadece çift terimler yakınsar', 'ln 3\'e yakınsar'],
    correctIndex: 1,
    setup: { fn: 'ln1p', N: 3, a: 0, x0: 2 },
    observe: { animate: { key: 'N', to: 14, durationMs: 3200 } },
    explain: 'Tekillik $x = -1$\'de; merkeze uzaklığı 1. Bu yüzden seri yalnızca $-1 < x \\le 1$ aralığında yakınsar. x = 2\'de terim ekledikçe hata **büyüdü**. Çözüm: merkezi kaydırmak (a\'yı artır).',
  },
];

const challenges: Challenge[] = [
  {
    id: 'sin-pi',
    setup: { fn: 'sin', N: 1, a: 0, x0: 2 },
    prompt: '$a = 0$ merkezli seriyle $\\sin x$\'i **x = π**\'de 0,01\'den küçük hatayla yaklaştır.',
    check: (p) => str(p, 'fn') === 'sin' && near(num(p, 'a'), 0, 1e-9) && taylorState({ ...p, x0: Math.PI }).error < 0.01,
    hints: ['İnceleme noktası önemli değil; π\'deki hata ölçülür.', 'Tek dereceli terimler eklenir: N = 9 dene.'],
  },
  {
    id: 'exp-two',
    setup: { fn: 'exp', N: 1, a: 0, x0: 2 },
    prompt: '$e^x$\'i **x = 2**\'de 0,01 hata altına, **en fazla 7. dereceyle** indir (a = 0).',
    check: (p) => str(p, 'fn') === 'exp' && near(num(p, 'a'), 0, 1e-9) && Math.round(num(p, 'N')) <= 7 && taylorState({ ...p, x0: 2 }).error < 0.01,
    hints: ['Kalan terim yaklaşık $\\frac{e^2\\,2^{N+1}}{(N+1)!}$.', 'N = 7 tam sınırda.'],
  },
  {
    id: 'shift-center',
    setup: { fn: 'geom', N: 8, a: 0, x0: 1.5 },
    prompt: '$\\frac{1}{1-x}$ için **x = 1,5**\'te 0,01\'den küçük hatalı bir yaklaşım elde et.',
    check: (p) => str(p, 'fn') === 'geom' && taylorState({ ...p, x0: 1.5 }).error < 0.01,
    hints: ['a = 0 merkezinde R = 1: x = 1,5 dışarıda kalır.', 'Merkezi x = 1\'in **öbür tarafına** taşı (a = 2) ve terim ekle.'],
  },
];

export const taylorModule: SimulationModule = {
  id: 'taylor-series',
  params,
  Component: TaylorSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const s = taylorState(p);
    return `\\begin{aligned}&f(x) = ${s.fn.tex} \\\\[3pt]&P_{${s.N}}(x) = ${polyTex(s.coeffs, s.a)}\\end{aligned}`;
  },
  readouts: (p) => {
    const s = taylorState(p);
    return [
      { label: `f(${fmt(s.x0, 2)})`, value: fmt(s.fn.f(s.x0), 5), tone: '--c-fn' },
      { label: `P${s.N}(${fmt(s.x0, 2)})`, value: fmt(s.P(s.x0), 5), tone: '--c-hot' },
      { label: 'Hata', value: fmt(s.error, 6) },
      { label: 'Yakınsaklık yarıçapı', value: Number.isFinite(s.R) ? fmt(s.R) : '∞', tone: '--c-tan' },
      { label: 'x yarıçap içinde mi?', value: Math.abs(s.x0 - s.a) < s.R ? 'evet' : 'hayır' },
    ];
  },
};

export default taylorModule;
