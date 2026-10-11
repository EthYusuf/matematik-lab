import { fmt, tex } from '../../core/math/format';
import { bool, num, str, type Challenge, type LessonStep, type ParamSchema, type ParamState, type SimulationModule } from '../../core/types';
import { argmax, binsMeanSd, diceRun, galtonRun, montyRun } from './model';
import { ProbabilitySimulation, trialsOf } from './Simulation';

const isGalton = (p: ParamState) => str(p, 'experiment') === 'galton';
const isMonty = (p: ParamState) => str(p, 'experiment') === 'monty';

const params: ParamSchema[] = [
  {
    kind: 'select',
    key: 'experiment',
    label: 'Deney',
    default: 'dice',
    options: [
      { value: 'dice', label: 'İki zar' },
      { value: 'galton', label: 'Galton tahtası' },
      { value: 'monty', label: 'Monty Hall' },
    ],
  },
  {
    kind: 'slider',
    key: 'trials',
    label: 'Deneme sayısı',
    min: 1,
    max: 10000,
    step: 1,
    default: 60,
    scale: 'log',
    tone: '--c-pt',
    format: (v) => fmt(Math.round(v), 0),
  },
  { kind: 'slider', key: 'rows', label: 'Çivi sırası n', min: 4, max: 16, step: 1, default: 10, visibleWhen: isGalton, format: (v) => String(Math.round(v)) },
  { kind: 'slider', key: 'p', label: 'Sağa sapma olasılığı p', min: 0.05, max: 0.95, step: 0.05, default: 0.5, tone: '--c-hot', visibleWhen: isGalton },
  { kind: 'toggle', key: 'montySwitch', label: 'Strateji: kapıyı değiştir', default: false, visibleWhen: isMonty },
  { kind: 'value', key: 'seed', default: 1 },
];

const lesson: LessonStep[] = [
  {
    kind: 'explore',
    title: 'İki zar at',
    body: `İki zar atılıp üstteki sayılar toplanıyor. Mavi çubuklar her toplamın **gözlenen sıklığı**, kırmızı noktalar **kuramsal olasılığı**.

Az denemede çubuklar düzensiz zıplar. **Yeniden at** düğmesiyle aynı deneyi tekrarla ve ne kadar değiştiğini gör.`,
    scene: { patch: { experiment: 'dice', trials: 60 } },
    sceneLabel: '60 atışla başla',
  },
  {
    kind: 'predict-choice',
    title: 'En olası toplam',
    question: 'Çok sayıda atış yapınca hangi toplam **en sık** gelir?',
    options: ['2', '7', '12', 'Hepsi eşit sıklıkta'],
    correctIndex: 1,
    setup: { experiment: 'dice', trials: 20 },
    observe: { animate: { key: 'trials', to: 5000, durationMs: 3500 } },
    explain:
      '7\'yi veren 6 farklı ikili var: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). 36 eşit olası sonuçtan 6\'sı: $P(7) = \\dfrac{6}{36} = \\dfrac{1}{6}$. 2 ve 12 ise yalnızca birer yolla gelir. Deneme sayısı arttıkça gözlenen sıklık kuramsal olasılığa yaklaşır: **büyük sayılar yasası**.',
  },
  {
    kind: 'predict-choice',
    title: 'Galton tahtası',
    question: 'Toplar her çivide yarı yarıya sağa ya da sola sapıyor. Binlerce top aşağı düşünce kutularda nasıl bir şekil oluşur?',
    options: ['Düz (her kutu eşit)', 'Ortada tepe yapan bir çan', 'Kenarlarda toplanan bir U', 'Tamamen rastgele'],
    correctIndex: 1,
    setup: { experiment: 'galton', trials: 5, rows: 10, p: 0.5 },
    observe: { animate: { key: 'trials', to: 3000, durationMs: 3800 } },
    explain:
      'Ortadaki kutuya ulaşmanın **çok sayıda** yolu var, kenardakilere ise tek yol. Kutu $k$\'ya düşme olasılığı **binom dağılımıdır**: $P(K=k) = \\binom{n}{k}p^k(1-p)^{n-k}$. Sıra sayısı artınca bu dağılım **normal (çan) eğrisine** yaklaşır.',
  },
  {
    kind: 'predict-choice',
    title: 'Monty Hall',
    question:
      'Üç kapıdan birinin arkasında araba var. Bir kapı seçiyorsun; sunucu kalan kapılardan **keçili** birini açıyor ve "Kapını değiştirmek ister misin?" diyor. Değiştirmek kazanma şansını nasıl etkiler?',
    options: ['Etkilemez, ikisi de 1/2', 'Şans 2/3\'e çıkar', 'Şans 1/3\'e düşer', 'Şans 1\'e çıkar'],
    correctIndex: 1,
    setup: { experiment: 'monty', trials: 3, montySwitch: true },
    observe: { animate: { key: 'trials', to: 4000, durationMs: 3800 } },
    explain:
      'İlk seçimin $\\frac13$ olasılıkla doğru. Yanlışsa (olasılık $\\frac23$), sunucu diğer keçiyi açmak **zorunda** kalır ve geriye kalan kapı kesinlikle arabadır. Bu yüzden değiştirmek $\\frac23$ kazandırır. Strateji anahtarını kapatıp aynı deneyi "kal" ile tekrarla.',
  },
  {
    kind: 'explore',
    title: 'Simülasyon neden işe yarar?',
    body: `Monte Carlo yöntemi: bir olasılığı formülle hesaplamak zorsa, deneyi bilgisayarda **binlerce kez** tekrarlayıp sıklığı ölçeriz.

Hata yaklaşık $\\dfrac{1}{\\sqrt{N}}$ ile azalır: 100 kat daha fazla deneme, 10 kat daha hassas sonuç verir. Galton tahtasında **p**'yi değiştirerek çanın nasıl kaydığını izle.`,
    scene: { patch: { experiment: 'galton', trials: 2000, rows: 12, p: 0.7 } },
    sceneLabel: 'p = 0,7 ile göster',
  },
];

const challenges: Challenge[] = [
  {
    id: 'monty-stay',
    setup: { experiment: 'monty', trials: 20, montySwitch: false },
    prompt: 'Monty Hall\'da **kal** stratejisiyle en az 1000 oyun oyna ve kazanma oranının $\\frac13$\'e **0,02**\'den yakın olduğunu göster.',
    check: (p) => {
      if (!isMonty(p) || bool(p, 'montySwitch')) return false;
      const n = trialsOf(p);
      return n >= 1000 && Math.abs(montyRun(num(p, 'seed'), n, false).wins / n - 1 / 3) < 0.02;
    },
    hints: ['Deneme sayısını 1000\'in üzerine çıkar.', 'Oran hâlâ uzaksa deneme sayısını artır ya da **Yeniden at**.'],
  },
  {
    id: 'galton-shift',
    setup: { experiment: 'galton', trials: 500, rows: 10, p: 0.5 },
    prompt: 'Galton tahtasında (en az 200 top) **en kalabalık kutu**, ortanın en az **2 kutu sağında** olsun.',
    check: (p) => {
      if (!isGalton(p)) return false;
      const n = trialsOf(p);
      const rows = Math.round(num(p, 'rows'));
      return n >= 200 && argmax(galtonRun(num(p, 'seed'), n, rows, num(p, 'p')).bins) >= rows / 2 + 2;
    },
    hints: ['Topların sağa sapma olasılığını değiştir.', 'Tepe noktası yaklaşık $n \\cdot p$ kutusundadır.'],
  },
  {
    id: 'seven-precise',
    setup: { experiment: 'dice', trials: 30 },
    prompt: 'İki zarda “toplam = 7” sıklığı $\\frac16$\'ya **0,005**\'ten yakın olsun (en az 1000 atış).',
    check: (p) => {
      if (str(p, 'experiment') !== 'dice') return false;
      const n = trialsOf(p);
      return n >= 1000 && Math.abs(diceRun(num(p, 'seed'), n).counts[5] / n - 1 / 6) < 0.005;
    },
    hints: ['Hata $\\frac{1}{\\sqrt N}$ gibi azalır: binlerce atış gerekir.', 'Deneme sayısını 10 000\'e çıkar; olmazsa **Yeniden at**.'],
  },
];

export const probabilityModule: SimulationModule = {
  id: 'probability-monte-carlo',
  params,
  Component: ProbabilitySimulation,
  lesson,
  challenges,
  formula: (p) => {
    if (isGalton(p)) {
      return `P(K = k) = \\binom{${Math.round(num(p, 'rows'))}}{k}\\,${tex(num(p, 'p'))}^{k}\\,${tex(1 - num(p, 'p'))}^{${Math.round(num(p, 'rows'))}-k}`;
    }
    if (isMonty(p)) {
      return bool(p, 'montySwitch')
        ? 'P(\\text{kazan} \\mid \\text{değiştir}) = 1 - \\tfrac13 = \\tfrac23'
        : 'P(\\text{kazan} \\mid \\text{kal}) = \\tfrac13';
    }
    return '\\begin{aligned}&S = Z_1 + Z_2 \\\\[3pt] &P(S = 7) = \\tfrac{6}{36} = \\tfrac16\\end{aligned}';
  },
  readouts: (p) => {
    const n = trialsOf(p);
    const seed = num(p, 'seed');
    if (isGalton(p)) {
      const rows = Math.round(num(p, 'rows'));
      const q = num(p, 'p');
      const { mean, sd } = binsMeanSd(galtonRun(seed, n, rows, q).bins);
      return [
        { label: 'Top sayısı', value: fmt(n, 0), tone: '--c-pt' },
        { label: 'Ortalama kutu', value: fmt(mean, 2), tone: '--c-fn' },
        { label: 'Kuramsal np', value: fmt(rows * q, 2), tone: '--c-hot' },
        { label: 'Std. sapma', value: fmt(sd, 2), tone: '--c-fn' },
        { label: 'Kuramsal √(np(1−p))', value: fmt(Math.sqrt(rows * q * (1 - q)), 2), tone: '--c-hot' },
      ];
    }
    if (isMonty(p)) {
      const sw = bool(p, 'montySwitch');
      const rate = montyRun(seed, n, sw).wins / n;
      return [
        { label: 'Oyun sayısı', value: fmt(n, 0), tone: '--c-pt' },
        { label: 'Kazanma oranı', value: fmt(rate, 3), tone: sw ? '--c-tan' : '--c-fn' },
        { label: 'Kuramsal', value: sw ? '2/3 ≈ 0,667' : '1/3 ≈ 0,333', tone: '--c-hot' },
        { label: 'Fark', value: fmt(Math.abs(rate - (sw ? 2 / 3 : 1 / 3)), 3) },
      ];
    }
    const counts = diceRun(seed, n).counts;
    const f7 = counts[5] / n;
    return [
      { label: 'Atış sayısı', value: fmt(n, 0), tone: '--c-pt' },
      { label: 'Gözlenen P(7)', value: fmt(f7, 4), tone: '--c-fn' },
      { label: 'Kuramsal P(7)', value: '1/6 ≈ 0,1667', tone: '--c-hot' },
      { label: 'Fark', value: fmt(Math.abs(f7 - 1 / 6), 4) },
      { label: 'En sık toplam', value: String(argmax(counts) + 2) },
    ];
  },
};

export default probabilityModule;
