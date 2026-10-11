"""
Parametrik soru üreticileri.

Her konu için `random.Random(seed)` alan ve bir `Question` döndüren bir fonksiyon vardır.
Aynı tohum her zaman aynı soruyu üretir; bu sayede cevap istemciye hiç gönderilmez,
kontrol sırasında soru sunucuda yeniden üretilip karşılaştırılır.
Cevaplar kesirlerle (Fraction) veya SymPy ile kesin olarak hesaplanır.
"""

from __future__ import annotations

import heapq
import math
import random
from collections.abc import Callable
from dataclasses import dataclass
from fractions import Fraction

import sympy as sp

x, y = sp.symbols("x y")


@dataclass
class Question:
    prompt: str
    kind: str  # "number" | "choice"
    explanation: str
    answer: float | None = None
    answer_text: str = ""
    tolerance: float = 1e-6
    options: list[str] | None = None
    correct: int | None = None


def _ftex(v: Fraction | int) -> str:
    v = Fraction(v)
    if v.denominator == 1:
        return str(v.numerator)
    sign = "-" if v < 0 else ""
    return rf"{sign}\frac{{{abs(v.numerator)}}}{{{v.denominator}}}"


def _dec(v: float, digits: int = 3) -> str:
    s = f"{v:.{digits}f}".rstrip("0").rstrip(".")
    return s.replace(".", ",").replace("-", "−")


def _num(prompt: str, value: Fraction | int | float | sp.Expr, explanation: str, tol: float | None = None, text: str | None = None) -> Question:
    if isinstance(value, sp.Basic):
        fval = float(value)
        default_text = f"${sp.latex(value)}$" + ("" if value.is_Integer else f" ≈ {_dec(fval)}")
    elif isinstance(value, Fraction):
        fval = float(value)
        default_text = f"${_ftex(value)}$" + ("" if value.denominator == 1 else f" ≈ {_dec(fval)}")
    else:
        fval = float(value)
        default_text = _dec(fval)
    if tol is None:
        tol = 1e-6 if float(fval).is_integer() else max(0.005, abs(fval) * 0.002)
    return Question(prompt=prompt, kind="number", explanation=explanation, answer=fval, answer_text=text or default_text, tolerance=tol)


def _choice(prompt: str, options: list[str], correct: str, explanation: str, rng: random.Random) -> Question:
    opts = options[:]
    rng.shuffle(opts)
    return Question(prompt=prompt, kind="choice", explanation=explanation, options=opts, correct=opts.index(correct), answer_text=correct)


GENERATORS: dict[str, Callable[[random.Random], Question]] = {}


def generator(topic: str):
    def wrap(fn: Callable[[random.Random], Question]):
        GENERATORS[topic] = fn
        return fn

    return wrap


def _nz(rng: random.Random, lo: int, hi: int) -> int:
    return rng.choice([v for v in range(lo, hi + 1) if v != 0])


# ---------------------------------------------------------------- Kademe 1


@generator("derivative-tangent")
def _derivative(rng: random.Random) -> Question:
    a, b, c, d = _nz(rng, -3, 3), rng.randint(-4, 4), rng.randint(-5, 5), rng.randint(-5, 5)
    x0 = rng.randint(-2, 3)
    f = a * x**3 + b * x**2 + c * x + d
    df = sp.diff(f, x)
    val = df.subs(x, x0)
    return _num(
        f"$f(x) = {sp.latex(f)}$ için $f'({x0})$ kaçtır?",
        val,
        f"Kuvvet kuralıyla $f'(x) = {sp.latex(df)}$. Yerine koyarsak $f'({x0}) = {sp.latex(val)}$.",
    )


@generator("riemann-integral")
def _integral(rng: random.Random) -> Question:
    a, b, c = _nz(rng, -3, 3), rng.randint(-4, 4), rng.randint(0, 4)
    k = rng.randint(1, 3)
    f = a * x**2 + b * x + c
    F = sp.integrate(f, x)
    val = sp.integrate(f, (x, 0, k))
    return _num(
        rf"$\displaystyle\int_0^{{{k}}} \left({sp.latex(f)}\right)dx$ kaçtır?",
        val,
        rf"Ters türev $F(x) = {sp.latex(F)}$. $F({k}) - F(0) = {sp.latex(val)}$.",
        tol=0.01,
    )


_ANGLES = [(0, "0"), (sp.pi / 6, r"\frac{\pi}{6}"), (sp.pi / 4, r"\frac{\pi}{4}"), (sp.pi / 3, r"\frac{\pi}{3}"), (sp.pi / 2, r"\frac{\pi}{2}"), (2 * sp.pi / 3, r"\frac{2\pi}{3}"), (sp.pi, r"\pi")]


@generator("trig-unit-circle")
def _trig(rng: random.Random) -> Question:
    kind = rng.choice(["period", "max", "value"])
    if kind == "period":
        A, B = _nz(rng, -4, 4), rng.choice([1, 2, 3, 4, 6])
        T = 2 * sp.pi / B
        return _num(
            f"$y = {A}\\sin({B}x)$ fonksiyonunun periyodu kaçtır? ($\\pi$ yazabilirsin)",
            T,
            rf"Periyot $T = \frac{{2\pi}}{{|B|}} = \frac{{2\pi}}{{{B}}} = {sp.latex(T)}$. Genlik periyodu etkilemez.",
            tol=0.01,
        )
    if kind == "max":
        A, B, D = _nz(rng, -4, 4), rng.randint(1, 3), rng.randint(-3, 3)
        dtex = "" if D == 0 else (f" + {D}" if D > 0 else f" - {-D}")
        return _num(
            f"$y = {A}\\sin({B}x){dtex}$ fonksiyonunun en büyük değeri kaçtır?",
            D + abs(A),
            f"$\\sin$ değeri $[-1, 1]$ aralığındadır. En büyük değer $D + |A| = {D} + {abs(A)} = {D + abs(A)}$.",
        )
    angle, atex = rng.choice(_ANGLES)
    fn = rng.choice([sp.sin, sp.cos])
    val = fn(angle)
    name = "sin" if fn is sp.sin else "cos"
    return _num(
        f"$\\{name}\\left({atex}\\right)$ kaçtır? (ondalık yazabilirsin)",
        val,
        f"Birim çemberde bu açıdaki noktanın {'yüksekliği' if name == 'sin' else 'yatay konumu'}: $\\{name}({atex}) = {sp.latex(val)}$.",
        tol=0.005,
    )


@generator("function-transforms")
def _quadratic(rng: random.Random) -> Question:
    r1, r2 = rng.sample(range(-5, 6), 2)
    f = sp.expand((x - r1) * (x - r2))
    roots = sorted(sp.solve(f, x))
    assert roots == sorted([r1, r2])
    kind = rng.choice(["sum", "product", "vertex", "delta"])
    if kind == "sum":
        return _num(f"${sp.latex(f)} = 0$ denkleminin köklerinin toplamı kaçtır?", r1 + r2, f"Vieta: $x_1 + x_2 = -\\frac{{b}}{{a}} = {r1 + r2}$. (Kökler {r1} ve {r2}.)")
    if kind == "product":
        return _num(f"${sp.latex(f)} = 0$ denkleminin köklerinin çarpımı kaçtır?", r1 * r2, f"Vieta: $x_1 x_2 = \\frac{{c}}{{a}} = {r1 * r2}$. (Kökler {r1} ve {r2}.)")
    if kind == "vertex":
        vx = Fraction(r1 + r2, 2)
        return _num(f"$f(x) = {sp.latex(f)}$ parabolünün tepe noktasının x koordinatı kaçtır?", vx, f"Tepe noktası köklerin ortasındadır: $r = -\\frac{{b}}{{2a}} = {_ftex(vx)}$.")
    a, b, c = 1, -(r1 + r2), r1 * r2
    return _num(f"$f(x) = {sp.latex(f)}$ için diskriminant $\\Delta = b^2 - 4ac$ kaçtır?", b * b - 4 * a * c, f"$\\Delta = ({b})^2 - 4\\cdot{a}\\cdot({c}) = {b * b - 4 * a * c}$. İki farklı kök olduğu için pozitif.")


@generator("probability-monte-carlo")
def _probability(rng: random.Random) -> Question:
    kind = rng.choice(["dice", "coins", "comb"])
    if kind == "dice":
        s = rng.randint(2, 12)
        p = Fraction(6 - abs(s - 7), 36)
        return _num(f"İki zar atılıyor. Toplamın **{s}** gelme olasılığı kaçtır? (kesir yazabilirsin)", p, f"36 eşit olası sonuçtan {6 - abs(s - 7)} tanesi toplamı {s} yapar: $P = {_ftex(p)}$.", tol=0.002)
    if kind == "coins":
        n = rng.randint(2, 5)
        p = 1 - Fraction(1, 2**n)
        return _num(f"Bir para {n} kez atılıyor. **En az bir kez** yazı gelme olasılığı kaçtır?", p, f"Tümleyen: hiç yazı gelmemesi $\\left(\\frac12\\right)^{n} = \\frac{{1}}{{{2**n}}}$. Cevap $1 - \\frac{{1}}{{{2**n}}} = {_ftex(p)}$.", tol=0.002)
    n = rng.randint(5, 9)
    k = rng.randint(2, 4)
    return _num(f"{n} kişilik bir sınıftan {k} kişilik bir grup kaç farklı şekilde seçilebilir?", math.comb(n, k), f"Sıra önemli değil: $\\binom{{{n}}}{{{k}}} = \\frac{{{n}!}}{{{k}!\\,{n - k}!}} = {math.comb(n, k)}$.")


@generator("limit-epsilon-delta")
def _limit(rng: random.Random) -> Question:
    if rng.random() < 0.65:
        r, s = _nz(rng, -4, 4), rng.randint(-5, 5)
        num = sp.expand((x - r) * (x + s))
        expr = num / (x - r)
        val = sp.limit(expr, x, r)
        assert val == r + s
        return _num(
            rf"$\displaystyle\lim_{{x\to {r}}} \frac{{{sp.latex(num)}}}{{x {'-' if r > 0 else '+'} {abs(r)}}}$ kaçtır?",
            val,
            rf"Pay $(x - ({r}))(x + ({s}))$ diye çarpanlarına ayrılır; sadeleşince $x + ({s})$ kalır. $x = {r}$ koyunca ${sp.latex(val)}$.",
        )
    k = _nz(rng, -5, 6)
    val = sp.limit(sp.sin(k * x) / x, x, 0)
    return _num(rf"$\displaystyle\lim_{{x\to 0}} \frac{{\sin({k}x)}}{{x}}$ kaçtır?", val, rf"$\frac{{\sin({k}x)}}{{x}} = {k}\cdot\frac{{\sin({k}x)}}{{{k}x}} \to {k}\cdot 1 = {k}$.")


# ---------------------------------------------------------------- Kademe 2


@generator("linear-transformations")
def _linear(rng: random.Random) -> Question:
    a, b, c, d = (rng.randint(-4, 4) for _ in range(4))
    det = sp.Matrix([[a, b], [c, d]]).det()
    return _num(
        rf"$A = \begin{{pmatrix}} {a} & {b} \\ {c} & {d} \end{{pmatrix}}$ matrisinin determinantı kaçtır?",
        det,
        rf"$\det A = ad - bc = ({a})({d}) - ({b})({c}) = {det}$. Birim kare bu matrisle $|{det}|$ alanlı bir paralelkenara dönüşür.",
    )


_TRIPLES = [(3, 4, 5), (5, 12, 13), (6, 8, 10), (8, 15, 17), (9, 12, 15)]


@generator("vectors")
def _vectors(rng: random.Random) -> Question:
    if rng.random() < 0.5:
        u = [rng.randint(-5, 5) for _ in range(2)]
        v = [rng.randint(-5, 5) for _ in range(2)]
        dot = u[0] * v[0] + u[1] * v[1]
        return _num(f"$\\vec u = ({u[0]}, {u[1]})$ ve $\\vec v = ({v[0]}, {v[1]})$ için $\\vec u \\cdot \\vec v$ kaçtır?", dot, f"$\\vec u\\cdot\\vec v = {u[0]}\\cdot{v[0]} + {u[1]}\\cdot{v[1]} = {dot}$.")
    a, b, c = rng.choice(_TRIPLES)
    sa, sb = rng.choice([-1, 1]), rng.choice([-1, 1])
    return _num(f"$\\vec v = ({sa * a}, {sb * b})$ vektörünün uzunluğu $|\\vec v|$ kaçtır?", c, f"$|\\vec v| = \\sqrt{{{a}^2 + {b}^2}} = \\sqrt{{{c * c}}} = {c}$.")


@generator("complex-numbers")
def _complex(rng: random.Random) -> Question:
    kind = rng.choice(["modulus", "product", "power"])
    if kind == "modulus":
        a, b, c = rng.choice(_TRIPLES)
        return _num(f"$|{a} + {b}i|$ kaçtır?", c, f"$|a + bi| = \\sqrt{{a^2 + b^2}} = \\sqrt{{{a * a + b * b}}} = {c}$.")
    if kind == "product":
        a, b, c, d = (_nz(rng, -4, 4) for _ in range(4))
        z = sp.expand((a + b * sp.I) * (c + d * sp.I))
        re_ = sp.re(z)
        return _num(f"$({a} {'+' if b > 0 else '-'} {abs(b)}i)({c} {'+' if d > 0 else '-'} {abs(d)}i)$ çarpımının **gerçek kısmı** kaçtır?", re_, f"$(a+bi)(c+di) = (ac - bd) + (ad + bc)i$. Gerçek kısım $ac - bd = {a * c} - ({b * d}) = {re_}$.")
    n = rng.randint(2, 11)
    val = sp.I**n
    labels = {1: "$1$", sp.I: "$i$", -1: "$-1$", -sp.I: "$-i$"}
    return _choice(f"$i^{{{n}}}$ neye eşittir?", list(labels.values()), labels[val], f"$i$'nin kuvvetleri 4'lü döngü yapar: $i, -1, -i, 1$. ${n} \\bmod 4 = {n % 4}$ → ${sp.latex(val)}$. Her $i$ ile çarpma 90° döndürmedir.", rng)


@generator("sequences-series")
def _series(rng: random.Random) -> Question:
    if rng.random() < 0.6:
        a = rng.randint(1, 6)
        k = rng.randint(2, 5)
        r = Fraction(1, k) * rng.choice([1, -1])
        s = Fraction(a) / (1 - r)
        return _num(
            f"İlk terimi {a}, ortak çarpanı ${_ftex(r)}$ olan sonsuz geometrik serinin toplamı kaçtır?",
            s,
            f"$|r| < 1$ olduğu için seri yakınsar: $S = \\frac{{a}}{{1 - r}} = \\frac{{{a}}}{{1 - ({_ftex(r)})}} = {_ftex(s)}$.",
            tol=0.01,
        )
    a, d, n = rng.randint(-5, 10), _nz(rng, -4, 6), rng.randint(8, 30)
    return _num(f"İlk terimi {a}, ortak farkı {d} olan aritmetik dizinin {n}. terimi kaçtır?", a + (n - 1) * d, f"$a_n = a_1 + (n-1)d = {a} + {n - 1}\\cdot({d}) = {a + (n - 1) * d}$.")


@generator("exponential-log")
def _explog(rng: random.Random) -> Question:
    kind = rng.choice(["log", "solve", "halflife"])
    if kind == "log":
        b, k = rng.choice([2, 3, 5, 10]), rng.randint(-2, 5)
        arg = sp.Rational(b) ** k
        return _num(f"$\\log_{{{b}}}\\left({sp.latex(arg)}\\right)$ kaçtır?", k, f"${b}^{{{k}}} = {sp.latex(arg)}$ olduğu için $\\log_{{{b}}}({sp.latex(arg)}) = {k}$.")
    if kind == "solve":
        b, k = rng.choice([2, 3, 4]), rng.randint(2, 6)
        return _num(f"${b}^{{x}} = {b**k}$ denkleminde $x$ kaçtır?", k, f"Her iki tarafın $\\log_{{{b}}}$'si alınır: $x = \\log_{{{b}}} {b**k} = {k}$.")
    m0, T, n = rng.choice([800, 640, 1600, 320]), rng.choice([2, 5, 8, 10]), rng.randint(1, 4)
    left = Fraction(m0, 2**n)
    return _num(f"Yarı ömrü {T} yıl olan {m0} g radyoaktif maddeden {n * T} yıl sonra kaç gram kalır?", left, f"{n * T} yıl = {n} yarı ömür. $m = {m0}\\cdot\\left(\\frac12\\right)^{{{n}}} = {_ftex(left)}$ g.")


@generator("statistics-clt")
def _stats(rng: random.Random) -> Question:
    if rng.random() < 0.5:
        data = [rng.randint(1, 20) for _ in range(5)]
        mean = Fraction(sum(data), len(data))
        return _num(f"${', '.join(map(str, data))}$ verisinin aritmetik ortalaması kaçtır?", mean, f"Toplam {sum(data)}, eleman sayısı 5: $\\bar x = {_ftex(mean)}$.", tol=0.01)
    sigma, n = rng.choice([6, 8, 10, 12, 15, 20]), rng.choice([4, 9, 16, 25, 36])
    se = Fraction(sigma, int(math.isqrt(n)))
    return _num(f"Standart sapması $\\sigma = {sigma}$ olan bir nüfustan $n = {n}$ büyüklüğünde örneklemler alınıyor. Örneklem ortalamalarının standart sapması kaçtır?", se, f"Merkezi limit teoremi: $\\sigma_{{\\bar x}} = \\frac{{\\sigma}}{{\\sqrt n}} = \\frac{{{sigma}}}{{{math.isqrt(n)}}} = {_ftex(se)}$.", tol=0.01)


# ---------------------------------------------------------------- Kademe 3


@generator("taylor-series")
def _taylor(rng: random.Random) -> Question:
    if rng.random() < 0.6:
        a, k = _nz(rng, -3, 3), rng.randint(2, 4)
        coeff = sp.series(sp.exp(a * x), x, 0, k + 1).removeO().coeff(x, k)
        return _num(
            f"$e^{{{a}x}}$ fonksiyonunun Maclaurin serisinde $x^{{{k}}}$ teriminin katsayısı kaçtır?",
            coeff,
            f"$e^{{u}} = \\sum \\frac{{u^n}}{{n!}}$, $u = {a}x$: katsayı $\\frac{{({a})^{{{k}}}}}{{{k}!}} = {sp.latex(coeff)}$.",
            tol=0.002,
        )
    k = rng.choice([3, 5, 7])
    coeff = sp.series(sp.sin(x), x, 0, k + 1).removeO().coeff(x, k)
    return _num(f"$\\sin x$ Maclaurin serisinde $x^{{{k}}}$ teriminin katsayısı kaçtır?", coeff, f"$\\sin x = x - \\frac{{x^3}}{{3!}} + \\frac{{x^5}}{{5!}} - \\dots$ → katsayı ${sp.latex(coeff)}$.", tol=0.0005)


@generator("fourier-series")
def _fourier(rng: random.Random) -> Question:
    if rng.random() < 0.5:
        return _choice(
            "Kare dalganın Fourier (sinüs) serisinde hangi harmonikler bulunur?",
            ["Yalnızca tek harmonikler (1, 3, 5, …)", "Yalnızca çift harmonikler (2, 4, 6, …)", "Tüm harmonikler eşit genlikte", "Yalnızca birinci harmonik"],
            "Yalnızca tek harmonikler (1, 3, 5, …)",
            "Kare dalga için $b_k = \\frac{4}{k\\pi}$ (k tek), $b_k = 0$ (k çift). Bu, dalganın yarım periyot simetrisinden gelir.",
            rng,
        )
    k = rng.choice([3, 5, 7, 9])
    return _num(f"Kare dalgada {k}. harmoniğin genliği, 1. harmoniğin genliğinin kaçta kaçıdır?", Fraction(1, k), f"$b_k = \\frac{{4}}{{k\\pi}}$ → $\\frac{{b_{k}}}{{b_1}} = \\frac{{1}}{{{k}}}$.", tol=0.002)


@generator("differential-equations")
def _ode(rng: random.Random) -> Question:
    a, y0 = _nz(rng, -2, 3), rng.randint(1, 5)
    h = rng.choice([Fraction(1, 10), Fraction(1, 5), Fraction(1, 2)])
    y1 = y0 * (1 + a * h)
    return _num(
        f"$y' = {a}y$, $y(0) = {y0}$. Euler yöntemiyle $h = {_ftex(h)}$ adımında $y({_ftex(h)})$ yaklaşık kaçtır?",
        y1,
        f"Euler: $y_1 = y_0 + h\\,f(x_0, y_0) = {y0} + {_ftex(h)}\\cdot({a}\\cdot{y0}) = {_ftex(y1)}$. (Gerçek değer ${y0}e^{{{a}\\cdot{_ftex(h)}}}$.)",
        tol=0.002,
    )


@generator("multivariable-calculus")
def _partial(rng: random.Random) -> Question:
    a, b, c = _nz(rng, -3, 3), _nz(rng, -3, 3), rng.randint(-4, 4)
    p, q = rng.randint(-2, 3), rng.randint(-2, 3)
    f = a * x**2 * y + b * x * y**2 + c * y
    var = rng.choice([x, y])
    d = sp.diff(f, var)
    val = d.subs({x: p, y: q})
    name = sp.latex(var)
    return _num(
        f"$f(x, y) = {sp.latex(f)}$ için $\\dfrac{{\\partial f}}{{\\partial {name}}}({p}, {q})$ kaçtır?",
        val,
        f"Diğer değişkeni sabit tutup türev al: $\\frac{{\\partial f}}{{\\partial {name}}} = {sp.latex(d)}$. $({p}, {q})$ noktasında ${sp.latex(val)}$.",
    )


_ELLIPSES = [(5, 3, 4), (5, 4, 3), (10, 6, 8), (10, 8, 6), (13, 5, 12), (13, 12, 5), (17, 8, 15), (17, 15, 8)]


@generator("conics")
def _conics(rng: random.Random) -> Question:
    a, b, c = rng.choice(_ELLIPSES)
    if rng.random() < 0.5:
        return _num(f"$\\frac{{x^2}}{{{a * a}}} + \\frac{{y^2}}{{{b * b}}} = 1$ elipsinin odakları $(\\pm c, 0)$. $c$ kaçtır?", c, f"Elipste $c^2 = a^2 - b^2 = {a * a} - {b * b} = {c * c}$ → $c = {c}$.")
    e = Fraction(c, a)
    return _num(f"$\\frac{{x^2}}{{{a * a}}} + \\frac{{y^2}}{{{b * b}}} = 1$ elipsinin dış merkezliği $e$ kaçtır?", e, f"$c = \\sqrt{{a^2 - b^2}} = {c}$, $e = \\frac{{c}}{{a}} = {_ftex(e)}$. $0 < e < 1$ elips demektir.", tol=0.005)


@generator("numerical-methods")
def _numerics(rng: random.Random) -> Question:
    if rng.random() < 0.6:
        N, x0 = rng.choice([2, 3, 5, 7, 10, 12]), rng.randint(1, 4)
        x1 = (Fraction(x0) + Fraction(N, x0)) / 2
        return _num(
            f"$f(x) = x^2 - {N}$ için Newton yönteminde $x_0 = {x0}$ ise $x_1$ kaçtır?",
            x1,
            f"$x_1 = x_0 - \\frac{{f(x_0)}}{{f'(x_0)}} = {x0} - \\frac{{{x0 * x0 - N}}}{{{2 * x0}}} = {_ftex(x1)}$.",
            tol=0.002,
        )
    a, b, k = 1, 2, rng.randint(3, 10)
    w = Fraction(b - a, 2**k)
    return _num(f"$[{a}, {b}]$ aralığında ikiye bölme yöntemiyle {k} adım sonra aralığın genişliği kaçtır?", w, f"Her adımda aralık yarıya iner: $\\frac{{{b - a}}}{{2^{{{k}}}}} = {_ftex(w)}$.", tol=max(1e-6, float(w) * 0.01))


# ---------------------------------------------------------------- Bonus


@generator("regression")
def _regression(rng: random.Random) -> Question:
    ys = [rng.randint(0, 9) for _ in range(4)]
    xs = [1, 2, 3, 4]
    xbar, ybar = Fraction(sum(xs), 4), Fraction(sum(ys), 4)
    slope = sum((xi - xbar) * (yi - ybar) for xi, yi in zip(xs, ys)) / sum((xi - xbar) ** 2 for xi in xs)
    pts = ", ".join(f"({a}, {b})" for a, b in zip(xs, ys))
    return _num(
        f"${pts}$ noktalarına en küçük kareler doğrusu uydurulursa eğim kaç olur?",
        slope,
        f"$m = \\frac{{\\sum (x_i - \\bar x)(y_i - \\bar y)}}{{\\sum (x_i - \\bar x)^2}}$, $\\bar x = {_ftex(xbar)}$, $\\bar y = {_ftex(ybar)}$ → $m = {_ftex(slope)}$.",
        tol=0.01,
    )


@generator("graph-theory")
def _graph(rng: random.Random) -> Question:
    nodes = "ABCDE"
    edges = {("A", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "D"), ("C", "E"), ("D", "E")}
    w = {e: rng.randint(1, 9) for e in sorted(edges)}
    adj: dict[str, list[tuple[str, int]]] = {n: [] for n in nodes}
    for (u, v), c in w.items():
        adj[u].append((v, c))
        adj[v].append((u, c))
    dist = {n: math.inf for n in nodes}
    dist["A"] = 0
    pq = [(0, "A")]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, c in adj[u]:
            if d + c < dist[v]:
                dist[v] = d + c
                heapq.heappush(pq, (dist[v], v))
    desc = ", ".join(f"{u}–{v}: {c}" for (u, v), c in w.items())
    return _num(
        f"Kenar ağırlıkları {desc} olan grafta A'dan E'ye en kısa yolun uzunluğu kaçtır?",
        int(dist["E"]),
        f"Dijkstra algoritmasıyla A'dan uzaklıklar: " + ", ".join(f"{n} = {int(dist[n])}" for n in nodes) + ".",
    )


TOPICS = sorted(GENERATORS)


def make_question(topic: str, seed: int) -> Question:
    return GENERATORS[topic](random.Random(f"{topic}:{seed}"))
