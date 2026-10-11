export interface PythonExample {
  id: string;
  title: string;
  topic: string;
  code: string;
}

/** Her konuyla ilişkili, düzenlenip çalıştırılabilen deneyler. */
export const EXAMPLES: PythonExample[] = [
  {
    id: 'monte-carlo-pi',
    title: 'Monte Carlo ile π',
    topic: 'probability-monte-carlo',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Kenarı 2 olan kareye rastgele noktalar at; birim çemberin içine düşenleri say.
rng = np.random.default_rng(42)
n = 5000
x, y = rng.uniform(-1, 1, n), rng.uniform(-1, 1, n)
inside = x**2 + y**2 <= 1

pi_tahmini = 4 * inside.mean()
print(f"{n} nokta ile π ≈ {pi_tahmini:.4f}   (gerçek: {np.pi:.4f})")

plt.figure(figsize=(4.2, 4.2))
plt.scatter(x[inside], y[inside], s=2, color="#2448c9", label="çemberin içi")
plt.scatter(x[~inside], y[~inside], s=2, color="#e4572e", label="dışı")
plt.gca().set_aspect("equal")
plt.legend(loc="upper right", fontsize=8)
plt.title("Alan oranı = π / 4")
`,
  },
  {
    id: 'derivative-sympy',
    title: 'Türev: SymPy ile sembolik',
    topic: 'derivative-tangent',
    code: `import sympy as sp

x = sp.symbols("x")
f = x**3 - 3*x

df = sp.diff(f, x)
print("f(x)  =", f)
print("f'(x) =", df)
print("Yatay teğet noktaları:", sp.solve(df, x))

# Kesen eğiminin limiti türevi verir:
h = sp.symbols("h")
kesen = (f.subs(x, x + h) - f) / h
print("lim h→0 kesen eğimi =", sp.limit(kesen, h, 0))
`,
  },
  {
    id: 'riemann-numpy',
    title: 'Riemann toplamları',
    topic: 'riemann-integral',
    code: `import numpy as np

f = lambda x: x**2
a, b = 0, 2
gercek = 8 / 3

print("   n      sol        orta       hata(sol)   hata(orta)")
for n in [4, 10, 100, 1000]:
    x = np.linspace(a, b, n + 1)
    dx = (b - a) / n
    sol = np.sum(f(x[:-1])) * dx
    orta = np.sum(f((x[:-1] + x[1:]) / 2)) * dx
    print(f"{n:5d}  {sol:9.5f}  {orta:9.5f}   {abs(sol-gercek):9.2e}   {abs(orta-gercek):9.2e}")
# Orta nokta kuralının hatası n² ile, sol kuralınki n ile azalır.
`,
  },
  {
    id: 'taylor-plot',
    title: 'Taylor serisi yaklaşımları',
    topic: 'taylor-series',
    code: `import numpy as np
import matplotlib.pyplot as plt
from math import factorial

x = np.linspace(-2 * np.pi, 2 * np.pi, 400)
plt.plot(x, np.sin(x), "k", lw=2.5, label="sin x")

for N in [1, 3, 5, 9]:
    P = sum((-1)**k * x**(2*k + 1) / factorial(2*k + 1) for k in range((N + 1) // 2))
    plt.plot(x, P, lw=1.4, label=f"N = {N}")

plt.ylim(-2.5, 2.5)
plt.legend(fontsize=8)
plt.title("Terim ekledikçe yaklaşım genişler")
`,
  },
  {
    id: 'fourier-square',
    title: 'Fourier: kare dalga',
    topic: 'fourier-series',
    code: `import numpy as np
import matplotlib.pyplot as plt

t = np.linspace(0, 2 * np.pi, 1000)
for N in [1, 3, 9, 49]:
    y = sum(4 / (k * np.pi) * np.sin(k * t) for k in range(1, N + 1, 2))
    plt.plot(t, y, lw=1.3, label=f"{N} harmonik")

plt.plot(t, np.sign(np.sin(t)), "k--", lw=1, label="kare dalga")
plt.legend(fontsize=8)
plt.title("Gibbs olayı: sıçramanın ~%9'u kadar taşma kalır")
`,
  },
  {
    id: 'clt',
    title: 'Merkezi limit teoremi',
    topic: 'statistics-clt',
    code: `import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
fig, axes = plt.subplots(1, 3, figsize=(9, 3), sharey=True)
for ax, n in zip(axes, [1, 5, 30]):
    ortalamalar = rng.exponential(1.0, size=(4000, n)).mean(axis=1)
    ax.hist(ortalamalar, bins=40, density=True, color="#2448c9", alpha=0.75)
    ax.set_title(f"n = {n}")
fig.suptitle("Çarpık (üstel) nüfus → ortalamalar çan eğrisine yaklaşır")
print("n = 30 için ortalamaların std. sapması ≈ 1/√30 =", round(1 / np.sqrt(30), 4))
`,
  },
  {
    id: 'newton',
    title: 'Newton-Raphson',
    topic: 'numerical-methods',
    code: `def newton(f, df, x0, adim=6):
    x = x0
    for k in range(adim):
        x = x - f(x) / df(x)
        print(f"x{k+1} = {x:.15f}")
    return x

# √2: f(x) = x² − 2
kok = newton(lambda x: x*x - 2, lambda x: 2*x, x0=1.0)
print("Gerçek √2 =", 2 ** 0.5)
# Doğru basamak sayısı her adımda yaklaşık ikiye katlanır (karesel yakınsama).
`,
  },
  {
    id: 'logistic-euler',
    title: 'Diferansiyel denklem: Euler vs gerçek',
    topic: 'differential-equations',
    code: `import numpy as np
import matplotlib.pyplot as plt

# y' = y, y(0) = 1  → gerçek çözüm e^x
for h in [0.5, 0.2, 0.05]:
    xs = np.arange(0, 2 + 1e-9, h)
    ys = [1.0]
    for _ in xs[1:]:
        ys.append(ys[-1] + h * ys[-1])   # Euler adımı
    plt.plot(xs, ys, "o-", ms=3, lw=1.2, label=f"Euler h = {h}")
    print(f"h = {h:<5} y(2) ≈ {ys[-1]:.4f}   hata = {np.e**2 - ys[-1]:.4f}")

x = np.linspace(0, 2, 200)
plt.plot(x, np.exp(x), "k", lw=2.2, label="e^x")
plt.legend(fontsize=8)
`,
  },
  {
    id: 'matrix',
    title: 'Lineer dönüşüm ve özvektörler',
    topic: 'linear-transformations',
    code: `import numpy as np

A = np.array([[2.0, 1.0],
              [1.0, 2.0]])

print("det(A) =", np.linalg.det(A), "→ alanlar bu kadar ölçeklenir")
degerler, vektorler = np.linalg.eig(A)
for lam, v in zip(degerler, vektorler.T):
    print(f"λ = {lam:.1f}, v = {np.round(v, 3)},  A·v = {np.round(A @ v, 3)}  (= λ·v)")
`,
  },
  {
    id: 'galton',
    title: 'Galton tahtası ve binom',
    topic: 'probability-monte-carlo',
    code: `import numpy as np
import matplotlib.pyplot as plt
from math import comb

rng = np.random.default_rng(7)
satir, top = 12, 3000
kutular = (rng.random((top, satir)) < 0.5).sum(axis=1)

plt.hist(kutular, bins=np.arange(satir + 2) - 0.5, color="#2448c9", alpha=0.75, label="simülasyon")
k = np.arange(satir + 1)
plt.plot(k, [top * comb(satir, i) / 2**satir for i in k], "o-", color="#e4572e", label="binom")
plt.legend()
plt.title(f"{top} top, {satir} sıra çivi")
`,
  },
];
