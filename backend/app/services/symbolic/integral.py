"""
Adım adım integral: SymPy'nin `manualintegrate` kural ağacını Türkçe adımlara çevirir.
"""

from __future__ import annotations

import dataclasses

import sympy as sp
from sympy.integrals.manualintegrate import integral_steps

from .parsing import X

_RULES: dict[str, tuple[str, str]] = {
    "ConstantRule": ("Sabitin integrali", r"\int c\,dx = c\,x"),
    "ConstantTimesRule": ("Sabit çarpanı dışarı al", r"\int c\,f(x)\,dx = c\int f(x)\,dx"),
    "PowerRule": ("Kuvvet kuralı", r"\int x^{n}\,dx = \frac{x^{n+1}}{n+1}"),
    "AddRule": ("Toplamın integrali", r"\int (f+g)\,dx = \int f\,dx + \int g\,dx"),
    "URule": ("Değişken değiştirme (u = g(x))", r"\int f(g(x))\,g'(x)\,dx = \int f(u)\,du"),
    "PartsRule": ("Kısmi integrasyon", r"\int u\,dv = u\,v - \int v\,du"),
    "CyclicPartsRule": ("Döngüsel kısmi integrasyon", r"\int u\,dv = u\,v - \int v\,du"),
    "ExpRule": ("Üstel fonksiyon", r"\int a^{x}\,dx = \frac{a^{x}}{\ln a}"),
    "ReciprocalRule": ("1/x kuralı", r"\int \frac{1}{x}\,dx = \ln|x|"),
    "SinRule": ("sin'in integrali", r"\int \sin x\,dx = -\cos x"),
    "CosRule": ("cos'un integrali", r"\int \cos x\,dx = \sin x"),
    "SecTanRule": ("sec·tan integrali", r"\int \sec x\tan x\,dx = \sec x"),
    "CscCotRule": ("csc·cot integrali", r"\int \csc x\cot x\,dx = -\csc x"),
    "SecSquaredRule": ("sec² integrali", r"\int \sec^2 x\,dx = \tan x"),
    "CscSquaredRule": ("csc² integrali", r"\int \csc^2 x\,dx = -\cot x"),
    "ArctanRule": ("arctan kuralı", r"\int \frac{dx}{a^2+x^2} = \frac{1}{a}\arctan\frac{x}{a}"),
    "ArcsinRule": ("arcsin kuralı", r"\int \frac{dx}{\sqrt{1-x^2}} = \arcsin x"),
    "RewriteRule": ("Yeniden yaz", r"f(x) = g(x) \Rightarrow \int f = \int g"),
    "TrigSubstitutionRule": ("Trigonometrik değişken değiştirme", r"x = a\sin\theta"),
    "PiecewiseRule": ("Parçalı fonksiyon", r"\int f = \textstyle\sum \int f_i"),
    "DontKnowRule": ("Kapalı formül bulunamadı", r"\int f(x)\,dx"),
}


def _children(rule) -> list:
    out = []
    for f in dataclasses.fields(rule):
        value = getattr(rule, f.name)
        if f.name == "alternatives" and value:
            out.append(value[0])  # alternatiflerden ilki yeterli
        elif dataclasses.is_dataclass(value) and hasattr(value, "integrand"):
            out.append(value)
        elif isinstance(value, (list, tuple)):
            out.extend(v for v in value if dataclasses.is_dataclass(v) and hasattr(v, "integrand"))
    return out


def _walk(rule, depth: int, steps: list[dict]) -> None:
    name = type(rule).__name__
    if name == "AlternativeRule":
        for child in _children(rule):
            _walk(child, depth, steps)
        return
    title, formula = _RULES.get(name, (name.replace("Rule", " kuralı"), ""))
    try:
        result = sp.latex(rule.eval())
    except Exception:  # noqa: BLE001 — eval desteklemeyen nadir kurallar
        result = ""
    step = {
        "rule": title,
        "formula": formula,
        "expression": r"\int " + sp.latex(rule.integrand) + r"\,d" + sp.latex(rule.variable),
        "result": result,
        "depth": depth,
    }
    if name == "PartsRule":
        step["formula"] += rf"\quad u = {sp.latex(rule.u)},\ dv = {sp.latex(rule.dv)}\,dx"
    if name == "URule":
        step["formula"] += rf"\quad u = {sp.latex(rule.u_func)}"
    steps.append(step)
    for child in _children(rule):
        _walk(child, depth + 1, steps)


def integral_with_steps(expr: sp.Expr, lower: sp.Expr | None = None, upper: sp.Expr | None = None) -> dict:
    steps: list[dict] = []
    try:
        tree = integral_steps(expr, X)
        _walk(tree, 0, steps)
        antiderivative = tree.eval()
    except Exception:  # noqa: BLE001 — manualintegrate her şeyi çözemez
        antiderivative = sp.integrate(expr, X)
    if antiderivative.has(sp.Integral):
        antiderivative = sp.integrate(expr, X)
    verified = sp.simplify(sp.diff(antiderivative, X) - expr) == 0

    out = {
        "input": sp.latex(expr),
        "antiderivative": sp.latex(sp.simplify(antiderivative)) + " + C",
        "verified": bool(verified),
        "steps": steps,
        "definite": None,
    }
    if lower is not None and upper is not None:
        value = sp.integrate(expr, (X, lower, upper))
        F = antiderivative
        steps.append(
            {
                "rule": "Analizin temel teoremi",
                "formula": r"\int_a^b f(x)\,dx = F(b) - F(a)",
                "expression": rf"\int_{{{sp.latex(lower)}}}^{{{sp.latex(upper)}}} {sp.latex(expr)}\,dx",
                "result": rf"\left[{sp.latex(F)}\right]_{{{sp.latex(lower)}}}^{{{sp.latex(upper)}}} = {sp.latex(sp.simplify(value))}",
                "depth": 0,
            }
        )
        out["definite"] = {
            "value": sp.latex(sp.simplify(value)),
            "numeric": float(value) if value.is_real and value.is_finite else None,
        }
    return out
