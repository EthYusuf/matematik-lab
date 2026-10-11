"""
Kullanıcının yazdığı matematik ifadesini GÜVENLİ biçimde SymPy ifadesine çevirir.

SymPy'nin `parse_expr` fonksiyonu içeride `eval` kullanır; bu yüzden ham kullanıcı
girdisi asla doğrudan verilmez. Önce kendi tokenizer'ımızla girdi taranır:
yalnızca sayılar, izinli isimler (x, sin, cos, pi, …) ve + - * / ^ ( ) kabul edilir.
Nokta ile öznitelik erişimi, alt çizgi, tırnak, köşeli parantez vb. hiçbir şey geçemez.
"""

from __future__ import annotations

import re

import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    rationalize,
    standard_transformations,
)

X = sp.Symbol("x", real=True)

MAX_LENGTH = 120
MAX_DEPTH = 12
MAX_NUMBER_DIGITS = 6

FUNCTIONS: dict[str, sp.Basic] = {
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "tg": sp.tan,
    "cot": sp.cot,
    "cotg": sp.cot,
    "sec": sp.sec,
    "csc": sp.csc,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "arcsin": sp.asin,
    "arccos": sp.acos,
    "arctan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "exp": sp.exp,
    "ln": sp.log,
    "log": sp.log,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
}

CONSTANTS: dict[str, sp.Basic] = {"pi": sp.pi, "π": sp.pi, "e": sp.E}
INFINITY: dict[str, sp.Basic] = {"oo": sp.oo, "inf": sp.oo, "sonsuz": sp.oo, "∞": sp.oo}

_TOKEN = re.compile(r"\s*(?:(?P<num>\d+(?:\.\d*)?|\.\d+)|(?P<name>[A-Za-zπ∞]+)|(?P<op>[-+*/^()]))")
_TRANSFORMS = standard_transformations + (implicit_multiplication_application, convert_xor, rationalize)


class ExpressionError(ValueError):
    """Kullanıcıya gösterilebilir (Türkçe) ayrıştırma hatası."""


def _normalize(text: str) -> str:
    text = text.strip()
    # Türkçe ondalık virgül: 2,5 → 2.5 (çok argümanlı fonksiyon desteklemediğimiz için güvenli)
    text = re.sub(r"(\d),(\d)", r"\1.\2", text)
    return text.replace("−", "-").replace("×", "*").replace("·", "*").replace("÷", "/").replace("²", "^2").replace("³", "^3")


def _validate(text: str, allow_infinity: bool) -> None:
    if not text:
        raise ExpressionError("İfade boş.")
    if len(text) > MAX_LENGTH:
        raise ExpressionError(f"İfade çok uzun (en fazla {MAX_LENGTH} karakter).")
    allowed = set(FUNCTIONS) | set(CONSTANTS) | {"x"} | (set(INFINITY) if allow_infinity else set())
    pos = 0
    depth = 0
    while pos < len(text):
        m = _TOKEN.match(text, pos)
        if not m or m.end() == pos:
            bad = text[pos:].strip()[:1]
            raise ExpressionError(f"İzin verilmeyen karakter: “{bad}”. Kullanabileceklerin: sayılar, x, + - * / ^ ( ) ve sin, cos, ln, sqrt gibi fonksiyonlar.")
        if m.group("num") and len(m.group("num").split(".")[0]) > MAX_NUMBER_DIGITS:
            raise ExpressionError("Sayı çok büyük.")
        name = m.group("name")
        if name is not None and name not in allowed:
            raise ExpressionError(f"Tanınmayan ifade: “{name}”. Çarpım için açıkça yaz: ör. x*sin(x).")
        op = m.group("op")
        if op == "(":
            depth += 1
            if depth > MAX_DEPTH:
                raise ExpressionError("Çok fazla iç içe parantez.")
        elif op == ")":
            depth -= 1
            if depth < 0:
                raise ExpressionError("Parantezler dengeli değil.")
        pos = m.end()
    if depth != 0:
        raise ExpressionError("Parantezler dengeli değil.")


def parse(text: str, *, allow_infinity: bool = False) -> sp.Expr:
    """Metni x değişkenli bir SymPy ifadesine çevirir; hata varsa ExpressionError fırlatır."""
    text = _normalize(text)
    _validate(text, allow_infinity)
    local = {"x": X, **FUNCTIONS, **CONSTANTS, **(INFINITY if allow_infinity else {})}
    # "π" ve "∞" Python tanımlayıcısı olabilse de açık eşleme daha güvenli
    text = text.replace("π", " pi ").replace("∞", " oo ")
    safe_globals = {"Integer": sp.Integer, "Float": sp.Float, "Rational": sp.Rational, "Symbol": sp.Symbol, "Function": sp.Function}
    try:
        expr = parse_expr(text, local_dict=local, global_dict=safe_globals, transformations=_TRANSFORMS, evaluate=True)
    except (SyntaxError, TypeError, ValueError, AttributeError, sp.SympifyError) as exc:
        raise ExpressionError("İfade anlaşılamadı. Örnek: x^2*sin(x) veya (x^2-1)/(x-1).") from exc
    if not isinstance(expr, sp.Expr):
        raise ExpressionError("Bir matematik ifadesi yazmalısın.")
    if expr.free_symbols - {X}:
        raise ExpressionError("Yalnızca x değişkeni kullanılabilir.")
    return expr


def parse_point(text: str) -> sp.Expr:
    """Limit noktası: sayı, π gibi sabitler veya ±∞."""
    value = parse(text, allow_infinity=True)
    if value.free_symbols:
        raise ExpressionError("Limit noktası x içeremez (ör. 0, 1, pi, oo).")
    return value
