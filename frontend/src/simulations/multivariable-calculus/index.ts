import { fmt, tex } from '../../core/math/format';
import { str, type Challenge, type LessonStep, type ParamSchema, type SimulationModule } from '../../core/types';
import { mvState, SURFACES } from './model';
import { MultivariableSimulation } from './Simulation';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'surface',
    label: 'Yüzey',
    default: 'bowl',
    options: Object.entries(SURFACES).map(([value, s]) => ({ value, label: s.label })),
  },
  { kind: 'slider', key: 'lr', label: 'Öğrenme oranı η', min: 0.01, max: 2.5, step: 0.01, default: 0.1, scale: 'log', tone: '--c-hot', format: (v) => fmt(v, 3) },
  { kind: 'slider', key: 'steps', label: 'Adım sayısı', min: 0, max: 60, step: 1, default: 0, tone: '--c-hot', format: (v) => String(Math.round(v)) },
  { kind: 'toggle', key: 'showGrad', label: 'Gradyan okunu göster', default: true },
  { kind: 'slider', key: 'az', label: 'Döndür (azimut)', min: 0, max: 360, step: 1, default: 35, format: (v) => `${Math.round(v)}°` },
  { kind: 'slider', key: 'el', label: 'Eğim (yükseklik)', min: 5, max: 85, step: 1, default: 32, format: (v) => `${Math.round(v)}°` },
  { kind: 'value', key: 'px', default: 2.5 },
  { kind: 'value', key: 'py', default: 2 },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'İki değişkenli fonksiyon = yüzey',
    body: `$f(x, y)$ her $(x, y)$ noktasına bir yükseklik verir: bir **dağ manzarası**. Solda 3B yüzey (sürükleyerek döndür), sağda aynı yüzeyin **eş yükselti haritası**: aynı yükseklikteki noktaları birleştiren çizgiler (harita üzerindeki izohipsler gibi).`,
    scene: { patch: { surface: 'wave', steps: 0, px: 0.5, py: 0.5, az: 35, el: 32 } },
    sceneLabel: 'Dalga yüzeyi',
  },
  {
    kind: 'predict-choice',
    title: 'Gradyan nereyi gösterir?',
    question: 'Gradyan vektörü $\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}\\right)$ hangi yönü gösterir?',
    options: ['Eş yükselti çizgisi boyunca', 'En hızlı **yükselme** yönünü, eş yükselti çizgilerine dik', 'En hızlı alçalma yönünü', 'Her zaman orijine doğru'],
    correctIndex: 1,
    setup: { surface: 'bowl', steps: 0, px: 2.5, py: 1, showGrad: false },
    observe: { patch: { showGrad: true } },
    explain:
      'Gradyan, yokuşun en dik **yukarı** yönüdür ve eş yükselti çizgilerine her zaman diktir. Çizgiler sıklaştıkça gradyan büyür (yamaç dikleşir). Aşağı inmek için tersine, $-\\nabla f$ yönüne gidilir.',
  },
  {
    kind: 'explore',
    title: 'Gradient descent',
    body: `Yapay zekâ modelleri hatayı böyle küçültür: bulunduğun yerde $-\\nabla f$ yönüne küçük bir adım at, tekrarla.

$$\\vec x_{k+1} = \\vec x_k - \\eta\\,\\nabla f(\\vec x_k)$$

**adım at**'a bas; kırmızı yol vadinin dibine iniyor. $\\eta$ (öğrenme oranı) adımın büyüklüğü.`,
    scene: { patch: { surface: 'bowl', lr: 0.15, steps: 0, px: 2.5, py: 2 } },
    sceneLabel: 'Çanakta başla',
  },
  {
    kind: 'predict-choice',
    title: 'Büyük adımlar',
    question: 'Öğrenme oranı $\\eta$ çok büyük seçilirse ne olur?',
    options: ['Daha hızlı ve güvenle iner', 'Vadinin iki yanı arasında zıplar ve **ıraksayabilir**', 'Hiç hareket etmez', 'Tam olarak tek adımda dibe iner'],
    correctIndex: 1,
    setup: { surface: 'bowl', lr: 0.15, steps: 12, px: 1.5, py: 1 },
    observe: { patch: { lr: 2.2 } },
    explain: 'Adım vadiyi aşıp karşı yamaca daha yükseğe düşüyor; her adımda daha da kötüleşiyor. Makine öğrenmesinde öğrenme oranı seçimi bu yüzden kritiktir: küçükse yavaş, büyükse kararsız.',
  },
  {
    kind: 'predict-choice',
    title: 'Eyer noktası',
    question: 'Eyer yüzeyinde $(0, 0)$\'da gradyan sıfırdır. Burası bir minimum mu?',
    options: ['Evet, en düşük nokta', 'Hayır: bir yönde minimum, diğer yönde maksimum (eyer)', 'Evet, en yüksek nokta', 'Gradyan sıfır olamaz'],
    correctIndex: 1,
    setup: { surface: 'bowl', steps: 0, px: 2, py: 0.05 },
    observe: { patch: { surface: 'saddle', lr: 0.2 }, animate: { key: 'steps', to: 30, durationMs: 3000 } },
    explain: 'Gradyanın sıfır olması yalnızca **kritik nokta** demektir. Eyer noktasında x yönünde vadi, y yönünde tepe var. Gradient descent önce merkeze yaklaştı, sonra y yönünde kayıp gitti.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'bowl-fast',
    setup: { surface: 'bowl', lr: 0.05, steps: 0, px: 2.5, py: 2 },
    prompt: 'Çanakta $(2{,}5;\\ 2)$\'den başlayıp **en fazla 20 adımda** minimuma 0,01\'den yakın ulaş.',
    check: (p) => {
      const st = mvState(p);
      return str(p, 'surface') === 'bowl' && st.steps <= 20 && Math.hypot(...st.end) < 0.01 && Math.hypot(st.start[0] - 2.5, st.start[1] - 2) < 1e-9;
    },
    hints: ['Her adımda uzaklık $(1 - \\eta)$ ile çarpılır.', '$\\eta \\approx 0{,}3$ ile 20 adım yeter.'],
  },
  {
    id: 'diverge',
    setup: { surface: 'bowl', lr: 0.1, steps: 0, px: 1.5, py: 1 },
    prompt: 'Gradient descent\'i **ıraksat**: en az 5 adımdan sonra fonksiyon değeri başlangıçtakinden büyük olsun.',
    check: (p) => {
      const st = mvState(p);
      return st.steps >= 5 && st.s.f(...st.end) > st.s.f(...st.start) + 1e-9;
    },
    hints: ['Öğrenme oranını büyüt.', 'Çanakta $\\eta > 2$ olunca her adım uzaklaştırır.'],
  },
  {
    id: 'other-minimum',
    setup: { surface: 'himmel', lr: 0.2, steps: 0, px: 0, py: 0 },
    prompt: 'Himmelblau yüzeyinin dört minimumundan **(3, 2) dışındaki** birine gradient descent ile in (f < 0,001).',
    check: (p) => {
      const st = mvState(p);
      const [x, y] = st.end;
      return str(p, 'surface') === 'himmel' && st.s.f(x, y) < 0.001 && Math.hypot(x - 3, y - 2) > 1;
    },
    hints: ['Hangi minimuma ineceğini başlangıç noktası belirler.', 'Haritada sol alt bölgeye tıkla ve 40+ adım at.'],
  },
];

export const multivariableModule: SimulationModule = {
  id: 'multivariable-calculus',
  params,
  Component: MultivariableSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const st = mvState(p);
    const [gx, gy] = st.s.grad(...st.start);
    return `\\begin{aligned}&${st.s.tex} \\\\[3pt]&\\nabla f(${tex(st.start[0], 1)}, ${tex(st.start[1], 1)}) = (${tex(gx, 3)},\\ ${tex(gy, 3)})\\end{aligned}`;
  },
  readouts: (p) => {
    const st = mvState(p);
    const [gx, gy] = st.s.grad(...st.start);
    return [
      { label: 'f(başlangıç)', value: fmt(st.s.f(...st.start), 4), tone: '--ink' },
      { label: '∂f/∂x', value: fmt(gx, 4) },
      { label: '∂f/∂y', value: fmt(gy, 4) },
      { label: '|∇f|', value: fmt(Math.hypot(gx, gy), 4), tone: '--c-hot' },
      { label: 'f(son nokta)', value: fmt(st.s.f(...st.end), 5), tone: '--c-pt' },
    ];
  },
};

export default multivariableModule;
