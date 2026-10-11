import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { EQUATIONS, eqOf, euler, sir } from './model';
import { DESimulation } from './Simulation';

const isMode = (m: string) => (p: ParamState) => str(p, 'mode') === m;

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'mode',
    label: 'Model',
    default: 'slope',
    options: [
      { value: 'slope', label: 'Yön alanı' },
      { value: 'sir', label: 'SIR salgını' },
      { value: 'lotka', label: 'Av – avcı' },
    ],
  },
  {
    kind: 'select',
    key: 'eq',
    label: 'Denklem',
    default: 'exp',
    options: Object.entries(EQUATIONS).map(([value, e]) => ({ value, label: e.label })),
    visibleWhen: isMode('slope'),
  },
  { kind: 'slider', key: 'h', label: 'Euler adımı h', min: 0.005, max: 1, step: 0.005, default: 0.5, scale: 'log', tone: '--c-hot', format: (v) => fmt(v, 3), visibleWhen: isMode('slope') },
  { kind: 'toggle', key: 'showEuler', label: 'Euler yöntemini göster', default: true, visibleWhen: isMode('slope') },
  { kind: 'slider', key: 'beta', label: 'Bulaşma hızı β', min: 0.05, max: 1, step: 0.01, default: 0.4, tone: '--c-hot', visibleWhen: isMode('sir') },
  { kind: 'slider', key: 'gamma', label: 'İyileşme hızı γ', min: 0.05, max: 0.5, step: 0.01, default: 0.1, tone: '--c-tan', visibleWhen: isMode('sir') },
  { kind: 'slider', key: 'alpha', label: 'Av üreme hızı α', min: 0.5, max: 1.5, step: 0.05, default: 1, tone: '--c-fn', visibleWhen: isMode('lotka') },
  { kind: 'slider', key: 'lb', label: 'Avlanma oranı β', min: 0.2, max: 1, step: 0.05, default: 0.5, tone: '--c-hot', visibleWhen: isMode('lotka') },
  { kind: 'slider', key: 'delta', label: 'Avcı beslenme δ', min: 0.1, max: 0.5, step: 0.05, default: 0.2, tone: '--c-hot', visibleWhen: isMode('lotka') },
  { kind: 'slider', key: 'lg', label: 'Avcı ölüm γ', min: 0.3, max: 1.2, step: 0.05, default: 0.6, tone: '--c-hot', visibleWhen: isMode('lotka') },
  { kind: 'slider', key: 'prey0', label: 'Başlangıç av', min: 0.5, max: 6, step: 0.1, default: 4, tone: '--c-fn', visibleWhen: isMode('lotka') },
  { kind: 'slider', key: 'pred0', label: 'Başlangıç avcı', min: 0.5, max: 6, step: 0.1, default: 1, tone: '--c-hot', visibleWhen: isMode('lotka') },
  { kind: 'value', key: 'x0', default: 0 },
  { kind: 'value', key: 'y0', default: 1 },
];

const eulerAt2 = (p: ParamState) => {
  const pts = euler(eqOf(str(p, 'eq')).f, num(p, 'x0'), num(p, 'y0'), num(p, 'h'), 2);
  return pts[pts.length - 1][1];
};

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Eğimlerin haritası',
    body: `Diferansiyel denklem, her noktadaki **eğimi** söyler: $y' = f(x, y)$. Gri çizgiler bu eğimlerin haritasıdır: **yön alanı**.

Çözüm eğrisi, bu çizgileri takip eden yoldur — rüzgârla sürüklenen bir yaprak gibi. Sarı başlangıç noktasını sürükle: farklı başlangıç, farklı çözüm.`,
    scene: { patch: { mode: 'slope', eq: 'linear', x0: 0, y0: 3, h: 0.5, showEuler: false } },
    sceneLabel: "y′ = x − y göster",
  },
  {
    kind: 'predict-choice',
    title: 'Euler yöntemi',
    question: "Euler yöntemi her adımda teğet doğrusu boyunca ilerler. $y' = y$ (çözümü $e^x$) için Euler'in sonucu gerçek değere göre nasıldır?",
    options: ['Tam olarak eşit', 'Gerçek değerin altında kalır', 'Gerçek değerin üstüne çıkar', 'Salınır'],
    correctIndex: 1,
    setup: { mode: 'slope', eq: 'exp', x0: 0, y0: 1, h: 0.5, showEuler: false },
    observe: { patch: { showEuler: true } },
    explain:
      '$e^x$ yukarı doğru bükülüyor (konveks). Teğet doğrusu eğrinin hep **altında** kalır; her adım biraz geride başlar ve hata birikir. h küçüldükçe hata azalır: Euler\'in hatası $h$ ile orantılıdır.',
  },
  {
    kind: 'explore',
    title: 'SIR salgın modeli',
    body: `Nüfus üç gruba ayrılır: **S** duyarlı, **I** enfekte, **R** iyileşen.

$$S' = -\\beta S I,\\quad I' = \\beta S I - \\gamma I,\\quad R' = \\gamma I$$

Kritik sayı **temel üreme sayısı** $R_0 = \\beta / \\gamma$: bir hastanın ortalama kaç kişiyi enfekte ettiği.`,
    scene: { patch: { mode: 'sir', beta: 0.4, gamma: 0.1 } },
    sceneLabel: 'R₀ = 4 ile başlat',
  },
  {
    kind: 'predict-choice',
    title: 'R₀ < 1',
    question: '$R_0 < 1$ olursa (ör. maske, aşı, karantina ile) salgın ne olur?',
    options: ['Daha geç ama daha büyük bir tepe yapar', 'Büyümeden söner', 'Herkes enfekte olur', 'Salınarak sürer'],
    correctIndex: 1,
    setup: { mode: 'sir', beta: 0.4, gamma: 0.1 },
    observe: { patch: { beta: 0.15, gamma: 0.2 } },
    explain: 'Her hasta 1\'den az kişiyi enfekte edince vaka sayısı baştan **azalır**: kırmızı eğri yükselmedi. "Eğriyi düzleştirmek", β\'yı düşürüp tepeyi aşağı çekmektir.',
  },
  {
    kind: 'predict-choice',
    title: 'Av ve avcı',
    question: 'Tavşanlar çoğalıp tepe yaptıktan sonra tilkilere ne olur?',
    options: ['Aynı anda tepe yaparlar', 'Biraz **gecikmeyle** tepe yaparlar, sonra tavşanlar azalır', 'Tükenirler', 'Hiç değişmezler'],
    correctIndex: 1,
    setup: { mode: 'lotka', alpha: 1, lb: 0.5, delta: 0.2, lg: 0.6, prey0: 4, pred0: 1 },
    observe: { patch: { prey0: 4.5 } },
    explain: 'Bol av, avcıları besler; avcılar çoğalınca av azalır; aç kalan avcılar azalınca av yeniden çoğalır… Sonsuz bir **döngü**: faz portresinde kapalı bir eğri.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'euler-accurate',
    setup: { mode: 'slope', eq: 'exp', x0: 0, y0: 1, h: 0.5, showEuler: true },
    prompt: "$y' = y$, $y(0) = 1$: Euler'in $x = 2$'deki hatasını **0,1**'in altına indir.",
    check: (p) => isMode('slope')(p) && str(p, 'eq') === 'exp' && num(p, 'x0') === 0 && num(p, 'y0') === 1 && Math.abs(eulerAt2(p) - Math.E ** 2) < 0.1,
    hints: ['Gerçek değer $e^2 \\approx 7{,}389$.', 'Euler sonucu $(1 + h)^{2/h}$; h ≈ 0,01 gerekir.'],
  },
  {
    id: 'flatten',
    setup: { mode: 'sir', beta: 0.4, gamma: 0.1 },
    prompt: 'Salgın büyüsün ($R_0 > 1$) ama enfektelerin tepe oranı **%20**\'nin altında kalsın: eğriyi düzleştir.',
    check: (p) => isMode('sir')(p) && num(p, 'beta') / num(p, 'gamma') > 1 && sir(num(p, 'beta'), num(p, 'gamma')).peak < 0.2,
    hints: ['β\'yı düşür ya da γ\'yı artır.', '$R_0$ yaklaşık 1,5–1,9 aralığında olmalı.'],
  },
  {
    id: 'equilibrium',
    setup: { mode: 'lotka', alpha: 1, lb: 0.5, delta: 0.2, lg: 0.6, prey0: 4, pred0: 1 },
    prompt: 'Av-avcı sistemini **dengeye** oturt: döngü tek bir noktaya küçülsün.',
    check: (p) => isMode('lotka')(p) && Math.abs(num(p, 'prey0') - num(p, 'lg') / num(p, 'delta')) < 0.051 && Math.abs(num(p, 'pred0') - num(p, 'alpha') / num(p, 'lb')) < 0.051,
    hints: ['Dengede iki türev de sıfırdır.', 'Av = γ/δ, avcı = α/β (sarı nokta).'],
  },
];

export const deModule: SimulationModule = {
  id: 'differential-equations',
  params,
  Component: DESimulation,
  lesson,
  challenges,
  formula: (p) => {
    const mode = str(p, 'mode');
    if (mode === 'sir') return `\\begin{aligned}&S' = -\\beta SI,\\ I' = \\beta SI - \\gamma I \\\\[3pt]&R_0 = \\frac{\\beta}{\\gamma} = \\frac{${tex(num(p, 'beta'))}}{${tex(num(p, 'gamma'))}} = ${tex(num(p, 'beta') / num(p, 'gamma'))}\\end{aligned}`;
    if (mode === 'lotka') return `\\begin{aligned}&x' = \\alpha x - \\beta xy \\\\[3pt]&y' = \\delta xy - \\gamma y\\end{aligned}`;
    const eq = eqOf(str(p, 'eq'));
    return `\\begin{aligned}&${eq.tex},\\quad y(${tex(num(p, 'x0'), 1)}) = ${tex(num(p, 'y0'), 1)} \\\\[3pt]&y_{n+1} = y_n + h\\,f(x_n, y_n)\\end{aligned}`;
  },
  readouts: (p) => {
    const mode = str(p, 'mode');
    if (mode === 'sir') {
      const r = sir(num(p, 'beta'), num(p, 'gamma'));
      return [
        { label: 'R₀', value: fmt(num(p, 'beta') / num(p, 'gamma'), 2), tone: '--c-hot' },
        { label: 'Tepe enfekte', value: `%${fmt(r.peak * 100, 1)}`, tone: '--c-hot' },
        { label: 'Tepe günü', value: fmt(r.peakDay, 0) },
        { label: 'Toplam enfekte olan', value: `%${fmt(r.finalR * 100, 1)}`, tone: '--c-tan' },
      ];
    }
    if (mode === 'lotka') {
      return [
        { label: 'Denge av (γ/δ)', value: fmt(num(p, 'lg') / num(p, 'delta'), 2), tone: '--c-fn' },
        { label: 'Denge avcı (α/β)', value: fmt(num(p, 'alpha') / num(p, 'lb'), 2), tone: '--c-hot' },
      ];
    }
    const isExp = str(p, 'eq') === 'exp' && num(p, 'x0') === 0;
    return [
      { label: 'Başlangıç', value: `(${fmt(num(p, 'x0'), 1)}, ${fmt(num(p, 'y0'), 1)})`, tone: '--c-pt' },
      { label: 'Adım h', value: fmt(num(p, 'h'), 3), tone: '--c-hot' },
      { label: 'Euler y(2)', value: fmt(eulerAt2(p), 4), tone: '--c-hot' },
      ...(isExp ? [{ label: 'Gerçek y(2) = y₀e²', value: fmt(num(p, 'y0') * Math.E ** 2, 4), tone: '--c-fn' }] : []),
    ];
  },
};

export default deModule;
