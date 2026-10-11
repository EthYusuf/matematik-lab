import { fmt, tex } from '../../core/math/format';
import { bool, type Challenge, type LessonStep, type ParamSchema, type ParamPatch, type ParamState, type SimulationModule } from '../../core/types';
import { DEFAULT_POINTS, N_POINTS, regState } from './model';
import { RegressionSimulation } from './Simulation';

const isUser = (p: ParamState) => bool(p, 'userLine');

const params: ParamSchema[] = [
  { kind: 'toggle', key: 'showResiduals', label: 'Artıkları göster', default: true },
  { kind: 'toggle', key: 'showSquares', label: 'Artıkların karelerini göster', default: false },
  { kind: 'toggle', key: 'userLine', label: 'Kendi doğrumu çizeceğim', default: false },
  { kind: 'slider', key: 'm', label: 'Eğim m', min: -2, max: 3, step: 0.01, default: 1, tone: '--c-hot', visibleWhen: isUser },
  { kind: 'slider', key: 'b', label: 'Kesişim b', min: -4, max: 6, step: 0.05, default: 0, tone: '--c-hot', visibleWhen: isUser },
  ...DEFAULT_POINTS.flatMap(([x, y], i): ParamSchema[] => [
    { kind: 'value', key: `p${i}x`, default: x },
    { kind: 'value', key: `p${i}y`, default: y },
  ]),
];

const RESET: ParamPatch = Object.fromEntries(DEFAULT_POINTS.flatMap(([x, y], i) => [[`p${i}x`, x], [`p${i}y`, y]]));
const LINE_POINTS: ParamPatch = Object.fromEntries(Array.from({ length: N_POINTS }, (_, i) => [[`p${i}x`, i + 1], [`p${i}y`, 0.5 * (i + 1) + 1]]).flat());

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'Noktalara doğru uydurmak',
    body: `Ders çalışma saati ile not, reklam bütçesi ile satış… Veriler bir doğru etrafında saçılıyorsa, en iyi doğruyu bulmak isteriz.

Yeşil doğru **en küçük kareler** doğrusu. Kırmızı kesikli çizgiler **artıklar**: her noktanın doğrudan dikey sapması. Noktaları sürükle.`,
    scene: { patch: { ...RESET, userLine: false, showResiduals: true, showSquares: false } },
    sceneLabel: 'Başlangıç verisi',
  },
  {
    kind: 'predict-choice',
    title: '"En iyi" ne demek?',
    question: 'En küçük kareler doğrusu tam olarak neyi en küçük yapar?',
    options: ['Noktalara olan en kısa (dik) uzaklıkların toplamını', 'Dikey artıkların **karelerinin** toplamını', 'Doğrunun eğimini', 'Doğrudan geçen nokta sayısını'],
    correctIndex: 1,
    setup: { ...RESET, userLine: false, showSquares: false },
    observe: { patch: { showSquares: true } },
    explain: 'Kırmızı karelerin **toplam alanı** (SSE = $\\sum (y_i - \\hat y_i)^2$) en küçüktür. Kare almak, büyük hataları daha çok cezalandırır ve türevle çözülebilen temiz bir formül verir.',
  },
  {
    kind: 'explore',
    title: 'Sen dene',
    body: `**Kendi doğrumu çizeceğim**'i aç ve eğim ile kesişimi ayarlayarak kırmızı karelerin toplam alanını küçültmeye çalış. Kesikli yeşil çizgi, hedefin olan en iyi doğru.

Ne kadar yaklaşabildin? Sağ panelde SSE değerlerini karşılaştır.`,
    scene: { patch: { ...RESET, userLine: true, showSquares: true, m: 0.2, b: 3 } },
    sceneLabel: 'Kendi doğrunu çiz',
  },
  {
    kind: 'predict-choice',
    title: 'Aykırı değer',
    question: 'Bir nokta diğerlerinden çok uzağa (ör. sağ alta) çekilirse doğru ne olur?',
    options: ['Hiç etkilenmez', 'O noktaya doğru belirgin biçimde **çekilir**', 'Tam o noktadan geçer', 'Yatay olur'],
    correctIndex: 1,
    setup: { ...RESET, userLine: false, showSquares: true },
    observe: { patch: { p5x: 7.5, p5y: 0 } },
    explain: 'Hatalar karesiyle cezalandırıldığı için tek bir uzak nokta, doğruyu kendine doğru büker: eğim düştü. Gerçek veride **aykırı değerlere** dikkat etmek bu yüzden önemlidir.',
  },
  {
    kind: 'predict-number',
    title: 'Mükemmel uyum',
    question: 'Tüm noktalar tam olarak bir doğrunun üzerindeyse belirlilik katsayısı $R^2$ kaç olur?',
    answer: 1,
    tolerance: 0.001,
    setup: { ...RESET, userLine: false, showSquares: false },
    observe: { patch: LINE_POINTS },
    explain: '$R^2 = 1 - \\frac{SSE}{SST}$: artık kalmayınca SSE = 0 ve $R^2 = 1$. Veri doğrusal ilişkiden ne kadar uzaksa $R^2$ o kadar 0\'a yaklaşır.',
  },
];

const challenges: Challenge[] = [
  {
    id: 'beat-the-line',
    setup: { ...RESET, userLine: true, showSquares: true, m: 0, b: 3 },
    prompt: 'Kendi doğrunla SSE\'yi en iyi değerin **%5** yakınına getir.',
    check: (p) => {
      const st = regState(p);
      return st.user && st.userSse <= st.fit.sse * 1.05 + 0.01;
    },
    hints: ['Önce eğimi, sonra kesişimi ayarla.', 'Kesikli yeşil doğruyu takip et.'],
  },
  {
    id: 'strong-fit',
    setup: { ...RESET, userLine: false },
    prompt: 'Noktaları öyle diz ki $R^2 > 0{,}95$ olsun ama eğim en az 0,3 olsun.',
    check: (p) => {
      const st = regState(p);
      return !st.user && st.fit.r2 > 0.95 && st.fit.m >= 0.3;
    },
    hints: ['Noktaları bir doğru üzerine yaklaştır.', 'Artıklar küçüldükçe R² artar.'],
  },
  {
    id: 'negative-slope',
    setup: { ...RESET, userLine: false },
    prompt: 'En küçük kareler doğrusunun eğimini **negatif** yap.',
    check: (p) => regState(p).fit.m < 0,
    hints: ['Sağdaki noktaları aşağı, soldakileri yukarı çek.'],
  },
];

export const regressionModule: SimulationModule = {
  id: 'regression',
  params,
  Component: RegressionSimulation,
  lesson,
  challenges,
  formula: (p) => {
    const { fit } = regState(p);
    return `\\begin{aligned}&\\hat y = ${tex(fit.m, 3)}\\,x ${fit.b < 0 ? '-' : '+'} ${tex(Math.abs(fit.b), 3)} \\\\[3pt]&SSE = \\sum (y_i - \\hat y_i)^2 = ${tex(fit.sse, 3)}\\end{aligned}`;
  },
  readouts: (p) => {
    const st = regState(p);
    return [
      { label: 'Eğim m*', value: fmt(st.fit.m, 4), tone: '--c-tan' },
      { label: 'Kesişim b*', value: fmt(st.fit.b, 4), tone: '--c-tan' },
      { label: 'R²', value: fmt(st.fit.r2, 4), tone: '--c-fn' },
      { label: 'SSE (en iyi)', value: fmt(st.fit.sse, 4) },
      ...(st.user ? [{ label: 'SSE (senin)', value: fmt(st.userSse, 4), tone: '--c-hot' }] : []),
    ];
  },
};

export default regressionModule;
