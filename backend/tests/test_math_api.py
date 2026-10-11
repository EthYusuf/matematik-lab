import time

import pytest

from app.services.symbolic.sandbox import ComputationTimeout, Sandbox


def test_derivative_endpoint(client) -> None:
    res = client.post("/api/math/derivative", json={"expression": "x^2 sin(x)"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["verified"] is True
    assert body["steps"][0]["rule"] == "Çarpım kuralı"


def test_integral_endpoint_definite(client) -> None:
    res = client.post("/api/math/integral", json={"expression": "x^2", "lower": "0", "upper": "3"})
    assert res.status_code == 200, res.text
    assert res.json()["definite"]["value"] == "9"


def test_limit_endpoint(client) -> None:
    res = client.post("/api/math/limit", json={"expression": "(x^2-4)/(x-2)", "point": "2"})
    assert res.status_code == 200, res.text
    assert res.json()["value"] == "4"


def test_bad_expression_gives_turkish_422(client) -> None:
    res = client.post("/api/math/derivative", json={"expression": "__import__('os')"})
    assert res.status_code == 422
    assert "İzin verilmeyen" in res.json()["detail"]


def test_sandbox_kills_long_computation_and_recovers() -> None:
    box = Sandbox(workers=1, timeout=1.5)
    try:
        with pytest.raises(ComputationTimeout):
            box.run(time.sleep, 30)
        # Havuz yeniden kurulur ve çalışmaya devam eder.
        assert box.run(abs, -3) == 3
    finally:
        box.shutdown()
