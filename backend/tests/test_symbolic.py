import pytest
import sympy as sp

from app.services.symbolic.derivative import derivative_with_steps
from app.services.symbolic.integral import integral_with_steps
from app.services.symbolic.limit import limit_with_steps
from app.services.symbolic.parsing import X, ExpressionError, parse, parse_point


class TestParsing:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("x^2", X**2),
            ("2x", 2 * X),
            ("x^2 sin(x)", X**2 * sp.sin(X)),
            ("sin x", sp.sin(X)),
            ("ln(x) + e^x", sp.log(X) + sp.exp(X)),
            ("2,5x", sp.Rational(5, 2) * X),
            ("0.5*x", X / 2),
            ("sqrt(x)", sp.sqrt(X)),
            ("2π", 2 * sp.pi),
            ("x²", X**2),
        ],
    )
    def test_accepts_math(self, text, expected) -> None:
        assert sp.simplify(parse(text) - expected) == 0

    @pytest.mark.parametrize(
        "text",
        [
            "__import__('os').system('dir')",
            "x.__class__",
            "lambda: 1",
            "exec(1)",
            "x; 1",
            "[x]",
            "y + 1",
            "open('a')",
            "Symbol('x')",
            "",
            "(" * 20 + "x" + ")" * 20,
            "x" * 200,
            "1234567890*x",
        ],
    )
    def test_rejects_unsafe_or_invalid(self, text) -> None:
        with pytest.raises(ExpressionError):
            parse(text)

    def test_point_infinity(self) -> None:
        assert parse_point("oo") == sp.oo
        assert parse_point("-∞") == -sp.oo
        with pytest.raises(ExpressionError):
            parse_point("x + 1")


class TestDerivative:
    @pytest.mark.parametrize(
        "text",
        ["x^3 - 3x", "x^2 sin(x)", "(x^2+1)/(x-3)", "e^(3x) + ln(x^2+1)", "sqrt(1 - x^2)", "2^x", "x^x", "tan(x)*cos(x)", "atan(2x)", "5"],
    )
    def test_matches_sympy(self, text) -> None:
        expr = parse(text)
        out = derivative_with_steps(expr)
        assert out["verified"], text
        assert out["steps"], text

    def test_rules_named(self) -> None:
        rules = [s["rule"] for s in derivative_with_steps(parse("x^2 sin(x)"))["steps"]]
        assert rules[0] == "Çarpım kuralı"
        assert "Kuvvet kuralı" in rules

    def test_chain_rule(self) -> None:
        rules = [s["rule"] for s in derivative_with_steps(parse("sin(x^2)"))["steps"]]
        assert rules[0].endswith("zincir kuralı")


class TestIntegral:
    @pytest.mark.parametrize("text", ["x^2", "3x^2 + 2x", "x e^x", "sin(x)", "1/x", "x^2 sin(x)", "e^(2x)", "1/(1+x^2)"])
    def test_antiderivative_verified(self, text) -> None:
        out = integral_with_steps(parse(text))
        assert out["verified"], text
        assert out["antiderivative"].endswith("+ C")

    def test_definite(self) -> None:
        out = integral_with_steps(parse("x^2"), parse_point("0"), parse_point("2"))
        assert out["definite"]["value"] == r"\frac{8}{3}"
        assert out["steps"][-1]["rule"] == "Analizin temel teoremi"

    def test_parts_rule_step(self) -> None:
        rules = [s["rule"] for s in integral_with_steps(parse("x e^x"))["steps"]]
        assert "Kısmi integrasyon" in rules


class TestLimit:
    def test_removable(self) -> None:
        out = limit_with_steps(parse("(x^2-1)/(x-1)"), parse_point("1"))
        assert out["value"] == "2"
        assert any(s["rule"] == "Çarpanlarına ayır ve sadeleştir" for s in out["steps"])

    def test_lhopital(self) -> None:
        out = limit_with_steps(parse("sin(x)/x"), parse_point("0"))
        assert out["value"] == "1"
        assert any("Hôpital" in s["rule"] for s in out["steps"])

    def test_direct_substitution(self) -> None:
        out = limit_with_steps(parse("x^2 + 1"), parse_point("2"))
        assert out["value"] == "5"
        assert out["steps"][0]["rule"] == "Doğrudan yerine koyma"

    def test_jump_has_no_limit(self) -> None:
        out = limit_with_steps(parse("abs(x)/x"), parse_point("0"))
        assert out["exists"] is False
        assert (out["left"], out["right"]) == ("-1", "1")

    def test_one_sided(self) -> None:
        assert limit_with_steps(parse("abs(x)/x"), parse_point("0"), "right")["value"] == "1"

    def test_at_infinity(self) -> None:
        assert limit_with_steps(parse("(3x^2+1)/(x^2-2)"), parse_point("oo"))["value"] == "3"
