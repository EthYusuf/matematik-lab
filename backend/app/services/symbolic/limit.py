"""
Adım adım limit: doğrudan yerine koyma → belirsizlik türü → sadeleştirme veya L'Hôpital.
Son söz her zaman `sympy.limit`'tedir; adımlar öğretici açıklamadır.
"""

from __future__ import annotations

import sympy as sp

from .parsing import X

DIRECTIONS = {"both": "+-", "right": "+", "left": "-"}


def _finite_real(value: sp.Expr) -> bool:
    return value.is_finite is True and value.is_real is True


def _side_limit(expr: sp.Expr, point: sp.Expr, d: str) -> sp.Expr:
    return sp.limit(expr, X, point, dir=d)


def limit_with_steps(expr: sp.Expr, point: sp.Expr, direction: str = "both") -> dict:
    steps: list[dict] = []
    arrow = {"both": "", "right": "^+", "left": "^-"}[direction]
    lim_tex = rf"\lim_{{x \to {sp.latex(point)}{arrow}}}"

    # 1) Doğrudan yerine koyma (yalnızca sonlu noktalar için)
    if point.is_finite:
        direct = sp.simplify(expr.subs(X, point))
        if _finite_real(direct):
            steps.append(
                {
                    "rule": "Doğrudan yerine koyma",
                    "formula": r"f \text{ sürekliyse } \lim_{x\to a} f(x) = f(a)",
                    "expression": rf"f({sp.latex(point)})",
                    "result": sp.latex(direct),
                    "depth": 0,
                }
            )
        else:
            num, den = sp.fraction(sp.together(expr))
            n0 = sp.limit(num, X, point)
            d0 = sp.limit(den, X, point)
            if n0 == 0 and d0 == 0:
                form = r"\frac{0}{0}"
            elif n0.is_infinite and d0.is_infinite:
                form = r"\frac{\infty}{\infty}"
            elif d0 == 0:
                form = r"\frac{c}{0}"
            else:
                form = sp.latex(direct)
            steps.append(
                {
                    "rule": "Doğrudan yerine koyma işe yaramadı",
                    "formula": "Belirsiz form",
                    "expression": rf"f({sp.latex(point)})",
                    "result": form,
                    "depth": 0,
                }
            )
            if form in (r"\frac{0}{0}", r"\frac{\infty}{\infty}"):
                simplified = sp.cancel(sp.factor(expr))
                if simplified != expr and _finite_real(sp.simplify(simplified.subs(X, point))):
                    steps.append(
                        {
                            "rule": "Çarpanlarına ayır ve sadeleştir",
                            "formula": r"\frac{(x-a)\,g(x)}{(x-a)\,h(x)} = \frac{g(x)}{h(x)}",
                            "expression": sp.latex(sp.factor(expr)),
                            "result": sp.latex(simplified),
                            "depth": 1,
                        }
                    )
                    steps.append(
                        {
                            "rule": "Şimdi yerine koy",
                            "formula": "",
                            "expression": rf"{lim_tex} {sp.latex(simplified)}",
                            "result": sp.latex(sp.simplify(simplified.subs(X, point))),
                            "depth": 1,
                        }
                    )
                else:
                    dn, dd = sp.diff(num, X), sp.diff(den, X)
                    steps.append(
                        {
                            "rule": "L'Hôpital kuralı",
                            "formula": r"\lim \frac{f}{g} = \lim \frac{f'}{g'}",
                            "expression": rf"{lim_tex} \frac{{{sp.latex(dn)}}}{{{sp.latex(dd)}}}",
                            "result": sp.latex(sp.limit(dn / dd, X, point)),
                            "depth": 1,
                        }
                    )
    else:
        steps.append(
            {
                "rule": "Sonsuzda davranış",
                "formula": r"\text{en baskın terimlere bak}",
                "expression": rf"{lim_tex} {sp.latex(expr)}",
                "result": sp.latex(sp.limit(expr, X, point)),
                "depth": 0,
            }
        )

    # 2) Kesin sonuç: sağ ve sol limitler
    left = right = None
    if point.is_finite:
        right = _side_limit(expr, point, "+")
        left = _side_limit(expr, point, "-")
    if direction == "right":
        value = right if right is not None else sp.limit(expr, X, point)
    elif direction == "left":
        value = left if left is not None else sp.limit(expr, X, point)
    elif point.is_finite:
        value = right if sp.simplify(right - left) == 0 or right == left else None
    else:
        value = sp.limit(expr, X, point)

    if direction == "both" and point.is_finite and value is None:
        steps.append(
            {
                "rule": "Sağdan ve soldan limitler farklı",
                "formula": r"\lim_{x\to a^-} f \ne \lim_{x\to a^+} f \Rightarrow \nexists",
                "expression": rf"{sp.latex(left)} \ne {sp.latex(right)}",
                "result": r"\text{limit yok}",
                "depth": 0,
            }
        )

    return {
        "input": rf"{lim_tex} {sp.latex(expr)}",
        "value": sp.latex(value) if value is not None else None,
        "exists": value is not None,
        "left": sp.latex(left) if left is not None else None,
        "right": sp.latex(right) if right is not None else None,
        "steps": steps,
    }
