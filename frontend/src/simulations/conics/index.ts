import { near } from '../../core/math/calculus';
import { fmt, tex } from '../../core/math/format';
import { num, str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { conicOf, dist } from './model';
import { ConicSimulation } from './Simulation';

const notParabola = (p: ParamState) => str(p, 'type') !== 'parabola';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'type',
    label: 'Konik',
    default: 'ellipse',
    options: [
      { value: 'ellipse', label: 'Elips' },
      { value: 'hyperbola', label: 'Hiperbol' },
      { value: 'parabola', label: 'Parabol' },
    ],
  },
  { kind: 'slider', key: 'a', label: 'a (yatay yarı eksen)', min: 0.5, max: 7, step: 0.1, default: 5, tone: '--c-fn', visibleWhen: notParabola },
  { kind: 'slider', key: 'b', label: 'b (dikey yarı eksen)', min: 0.5, max: 5.5, step: 0.05, default: 3, tone: '--c-fn', visibleWhen: notParabola },
  { kind: 'slider', key: 'p', label: 'Odak uzaklığı p', min: 0.25, max: 3, step: 0.25, default: 1, tone: '--c-hot', visibleWhen: (p) => !notParabola(p) },
  { kind: 'toggle', key: 'showDirectrix', label: 'Doğrultman', default: false },
  { kind: 'toggle', key: 'showReflection', label: 'Teğet ve yansıma', default: false },
  { kind: 'value', key: 't', default: 1 },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'İki ipli çizim',
    body: `İki çiviye bağlı bir ipi kalemle gergin tutarak çizersen **elips** elde edersin. Çiviler **odaklardır** ($F_1, F_2$).

Bu yüzden elipsin her noktasında: $PF_1 + PF_2 = 2a$ (ipin uzunluğu). P'yi sürükle, toplamın hiç değişmediğini gör.`,
    scene: { patch: { type: 'ellipse', a: 5, b: 3, t: 1, showDirectrix: false, showReflection: false } },
    sceneLabel: 'Elipsi kur',
  },
  {
    kind: 'predict-number',
    title: 'Odak uzaklığı',
    question: '$a = 5$, $b = 3$ olan elipsin odakları $(\\pm c, 0)$. $c$ kaçtır?',
    answer: 4,
    tolerance: 0.01,
    setup: { type: 'ellipse', a: 5, b: 3, t: Math.PI / 2 },
    observe: { patch: { t: Math.PI / 2 } },
    explain: 'P en tepedeyken $PF_1 = PF_2 = a = 5$ ve dik üçgen oluşur: $c^2 = a^2 - b^2 = 25 - 9 = 16$, $c = 4$.',
  },
  {
    kind: 'predict-choice',
    title: 'Dış merkezlik',
    question: 'Dış merkezlik $e = \\frac{c}{a}$ sıfıra giderse elips neye dönüşür?',
    options: ['Doğruya', 'Çembere', 'Parabole', 'Hiperbole'],
    correctIndex: 1,
    setup: { type: 'ellipse', a: 5, b: 2, t: 1 },
    observe: { animate: { key: 'b', to: 5, durationMs: 2500 } },
    explain: '$b \\to a$ iken $c \\to 0$: iki odak merkezde birleşir ve elips **çembere** dönüşür. Gezegen yörüngeleri $e$\'si küçük elipslerdir (Dünya: e ≈ 0,017).',
  },
  {
    kind: 'explore',
    title: 'Parabolün sihri',
    body: `Parabol: odağa uzaklığı, **doğrultman** doğrusuna uzaklığına eşit olan noktalar.

Sonuç: eksene paralel gelen her ışın, yansıyıp **odaktan** geçer. Çanak antenler, el fenerleri ve güneş ocakları bu yüzden parabol biçimlidir. P'yi sürükle: sarı ışın her zaman F'ye gider.`,
    scene: { patch: { type: 'parabola', p: 1.5, t: 3, showDirectrix: true, showReflection: true } },
    sceneLabel: 'Işını göster',
  },
  {
    kind: 'predict-choice',
    title: 'Hiperbol',
    question: 'Hiperbolde $PF_1$ ile $PF_2$ arasındaki ilişki nedir?',
    options: ['Toplamları sabittir (2a)', 'Farklarının mutlak değeri sabittir (2a)', 'Çarpımları sabittir', 'Eşittirler'],
    correctIndex: 1,
    setup: { type: 'hyperbola', a: 2, b: 1.5, t: 0.4, showDirectrix: false, showReflection: false },
    observe: { animate: { key: 't', to: 1.6, durationMs: 2500 } },
    explain: 'Hiperbolde $|PF_1 - PF_2| = 2a$. GPS\'ten önceki LORAN seyir sistemi, iki vericiden gelen sinyallerin **varış farkını** ölçerek gemiyi bir hiperbol üzerine yerleştirirdi.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'ellipse-foci',
    setup: { type: 'ellipse', a: 3, b: 2, t: 1 },
    prompt: 'Odakları $(\\pm 4,\\ 0)$ ve $PF_1 + PF_2 = 10$ olan elipsi kur.',
    check: (p) => {
      const c = conicOf(p);
      return c.type === 'ellipse' && near(c.a, 5, 1e-6) && near(c.c, 4, 0.01) && near(dist(c.point, c.foci[0]) + dist(c.point, c.foci[1]), 10, 0.01);
    },
    hints: ['$PF_1 + PF_2 = 2a$', '$b^2 = a^2 - c^2$'],
  },
  {
    id: 'hyperbola-e2',
    setup: { type: 'hyperbola', a: 2, b: 1.5, t: 0.5 },
    prompt: 'Dış merkezliği **2** olan bir hiperbol kur (±0,02).',
    check: (p) => {
      const c = conicOf(p);
      return c.type === 'hyperbola' && Math.abs(c.e - 2) < 0.02;
    },
    hints: ['Hiperbolde $c^2 = a^2 + b^2$ ve $e = \\frac{c}{a}$.', '$e = 2 \\Rightarrow b = a\\sqrt3$'],
  },
  {
    id: 'parabola-focus',
    setup: { type: 'parabola', p: 1, t: 2, showReflection: true },
    prompt: 'Odak noktası $(0,\\ 2)$ olan parabolü kur: $y = \\frac{x^2}{4p}$.',
    check: (p) => str(p, 'type') === 'parabola' && near(num(p, 'p'), 2, 1e-9),
    hints: ['Odak $(0, p)$\'dir.', '$y = \\frac{x^2}{8}$'],
  },
];

export const conicModule: SimulationModule = {
  id: 'conics',
  params,
  Component: ConicSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const c = conicOf(p);
    if (c.type === 'parabola') return `\\begin{aligned}&y = \\frac{x^2}{4p} = \\frac{x^2}{${tex(4 * c.p)}} \\\\[3pt]&F = (0,\\ ${tex(c.p)}),\\quad y = -${tex(c.p)}\\end{aligned}`;
    if (c.type === 'hyperbola')
      return `\\begin{aligned}&\\frac{x^2}{${tex(c.a * c.a)}} - \\frac{y^2}{${tex(c.b * c.b)}} = 1 \\\\[3pt]&c = \\sqrt{a^2 + b^2} = ${tex(c.c, 3)},\\ e = ${tex(c.e, 3)}\\end{aligned}`;
    return `\\begin{aligned}&\\frac{x^2}{${tex(c.a * c.a)}} + \\frac{y^2}{${tex(c.b * c.b)}} = 1 \\\\[3pt]&c = ${tex(c.c, 3)},\\ e = \\frac{c}{a} = ${tex(c.e, 3)}\\end{aligned}`;
  },
  readouts: (p) => {
    const c = conicOf(p);
    const d1 = dist(c.point, c.foci[0]);
    const rows = [
      { label: 'Odak uzaklığı c', value: fmt(c.c, 3), tone: '--c-hot' },
      { label: 'Dış merkezlik e', value: fmt(c.e, 3), tone: '--c-pt' },
    ];
    if (c.type === 'parabola') return [...rows, { label: 'PF', value: fmt(d1, 3) }, { label: 'P – doğrultman', value: fmt(c.point[1] - c.directrix, 3) }];
    const d2 = dist(c.point, c.foci[1]);
    return [
      ...rows,
      { label: 'PF₁', value: fmt(d1, 3), tone: '--c-hot' },
      { label: 'PF₂', value: fmt(d2, 3), tone: '--c-tan' },
      c.type === 'ellipse' ? { label: 'PF₁ + PF₂', value: fmt(d1 + d2, 3) } : { label: '|PF₁ − PF₂|', value: fmt(Math.abs(d1 - d2), 3) },
    ];
  },
};

export default conicModule;
