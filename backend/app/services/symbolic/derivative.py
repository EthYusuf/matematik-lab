"""
Adım adım türev: ifade ağacını gezip her düğümde hangi kuralın uygulandığını kaydeder.
Sonuç her zaman SymPy'nin kendi `diff` sonucuyla doğrulanır.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import sympy as sp

from .parsing import X

_t = sp.Dummy("t")


@dataclass
class Step:
    rule: str
    formula: str
    expression: str
    depth: int
    result: str = ""

    def as_dict(self) -> dict:
        return {"rule": self.rule, "formula": self.formula, "expression": self.expression, "result": self.result, "depth": self.depth}


@dataclass
class _Ctx:
    steps: list[Step] = field(default_factory=list)


# Fonksiyon → (kural adı, genel formül)
_FUNCTION_RULES: dict[type, tuple[str, str]] = {
    sp.sin: ("sin'in türevi", r"(\sin u)' = \cos u \cdot u'"),
    sp.cos: ("cos'un türevi", r"(\cos u)' = -\sin u \cdot u'"),
    sp.tan: ("tan'ın türevi", r"(\tan u)' = (1 + \tan^2 u)\, u'"),
    sp.cot: ("cot'un türevi", r"(\cot u)' = -(1 + \cot^2 u)\, u'"),
    sp.sec: ("sec'in türevi", r"(\sec u)' = \sec u \tan u \cdot u'"),
    sp.csc: ("csc'nin türevi", r"(\csc u)' = -\csc u \cot u \cdot u'"),
    sp.exp: ("Üstel fonksiyon", r"(e^{u})' = e^{u} \cdot u'"),
    sp.log: ("Logaritma", r"(\ln u)' = \frac{u'}{u}"),
    sp.asin: ("arcsin'in türevi", r"(\arcsin u)' = \frac{u'}{\sqrt{1-u^2}}"),
    sp.acos: ("arccos'un türevi", r"(\arccos u)' = -\frac{u'}{\sqrt{1-u^2}}"),
    sp.atan: ("arctan'ın türevi", r"(\arctan u)' = \frac{u'}{1+u^2}"),
    sp.sinh: ("sinh'in türevi", r"(\sinh u)' = \cosh u \cdot u'"),
    sp.cosh: ("cosh'un türevi", r"(\cosh u)' = \sinh u \cdot u'"),
    sp.tanh: ("tanh'ın türevi", r"(\tanh u)' = (1 - \tanh^2 u)\, u'"),
    sp.Abs: ("Mutlak değer", r"|u|' = \operatorname{sgn}(u)\, u'"),
}


def _d_tex(expr: sp.Expr) -> str:
    return r"\frac{d}{dx}\left[" + sp.latex(expr) + r"\right]"


def _step(ctx: _Ctx, rule: str, formula: str, expr: sp.Expr, depth: int) -> Step:
    s = Step(rule=rule, formula=formula, expression=_d_tex(expr), depth=depth)
    ctx.steps.append(s)
    return s


def _diff(expr: sp.Expr, ctx: _Ctx, depth: int) -> sp.Expr:
    if not expr.has(X):
        s = _step(ctx, "Sabit kuralı", r"(c)' = 0", expr, depth)
        s.result = "0"
        return sp.Integer(0)

    if expr == X:
        s = _step(ctx, "Özdeşlik", r"(x)' = 1", expr, depth)
        s.result = "1"
        return sp.Integer(1)

    if expr.is_Add:
        s = _step(ctx, "Toplam kuralı", r"(u \pm v)' = u' \pm v'", expr, depth)
        result = sp.Add(*[_diff(term, ctx, depth + 1) for term in expr.args])
        s.result = sp.latex(result)
        return result

    if expr.is_Mul:
        coeff, rest = expr.as_independent(X, as_Add=False)
        if coeff != 1:
            s = _step(ctx, "Sabit çarpan kuralı", r"(c\,u)' = c\,u'", expr, depth)
            result = coeff * _diff(rest, ctx, depth + 1)
            s.result = sp.latex(result)
            return result
        num, den = sp.fraction(expr)
        if den != 1 and den.has(X):
            s = _step(ctx, "Bölüm kuralı", r"\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}", expr, depth)
            du = _diff(num, ctx, depth + 1)
            dv = _diff(den, ctx, depth + 1)
            result = (du * den - num * dv) / den**2
            s.result = sp.latex(result)
            return result
        u, v = expr.args[0], sp.Mul(*expr.args[1:])
        s = _step(ctx, "Çarpım kuralı", r"(u\,v)' = u'v + u\,v'", expr, depth)
        result = _diff(u, ctx, depth + 1) * v + u * _diff(v, ctx, depth + 1)
        s.result = sp.latex(result)
        return result

    if expr.is_Pow:
        base, exp = expr.as_base_exp()
        if not exp.has(X):
            if base == X:
                s = _step(ctx, "Kuvvet kuralı", r"(x^n)' = n\,x^{n-1}", expr, depth)
                result = exp * X ** (exp - 1)
                s.result = sp.latex(result)
                return result
            s = _step(ctx, "Kuvvet + zincir kuralı", r"(u^n)' = n\,u^{n-1}\cdot u'", expr, depth)
            result = exp * base ** (exp - 1) * _diff(base, ctx, depth + 1)
            s.result = sp.latex(result)
            return result
        if not base.has(X):
            s = _step(ctx, "Üstel fonksiyon", r"(a^{u})' = a^{u}\ln a \cdot u'", expr, depth)
            inner = _diff(exp, ctx, depth + 1)
            result = expr * sp.log(base) * inner
            s.result = sp.latex(result)
            return result
        s = _step(ctx, "Logaritmik türev", r"(u^{v})' = u^{v}\left(v'\ln u + \frac{v\,u'}{u}\right)", expr, depth)
        result = sp.diff(expr, X)
        s.result = sp.latex(result)
        return result

    if isinstance(expr, sp.Function) and len(expr.args) == 1 and type(expr) in _FUNCTION_RULES:
        name, formula = _FUNCTION_RULES[type(expr)]
        arg = expr.args[0]
        outer = sp.diff(expr.func(_t), _t).subs(_t, arg)
        if arg == X:
            s = _step(ctx, name, formula, expr, depth)
            s.result = sp.latex(outer)
            return outer
        s = _step(ctx, f"{name} + zincir kuralı", formula, expr, depth)
        result = outer * _diff(arg, ctx, depth + 1)
        s.result = sp.latex(result)
        return result

    s = _step(ctx, "Türev (SymPy)", r"\frac{d}{dx}", expr, depth)
    result = sp.diff(expr, X)
    s.result = sp.latex(result)
    return result


def derivative_with_steps(expr: sp.Expr) -> dict:
    ctx = _Ctx()
    raw = _diff(expr, ctx, 0)
    # Birkaç sadeleştirme dener, en kısa olanı seçer.
    candidates = [sp.simplify(raw), sp.factor(sp.cancel(sp.together(raw))), sp.cancel(sp.together(raw)), sp.expand(raw)]
    simplified = min(candidates, key=lambda e: (sp.count_ops(e), len(str(e))))
    reference = sp.diff(expr, X)
    verified = sp.simplify(simplified - reference) == 0
    return {
        "input": sp.latex(expr),
        "result": sp.latex(raw),
        "simplified": sp.latex(simplified),
        "verified": bool(verified),
        "steps": [s.as_dict() for s in ctx.steps],
    }
