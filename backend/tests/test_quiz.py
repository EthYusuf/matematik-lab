import math

import pytest

from app.services.quiz.answers import parse_answer
from app.services.quiz.generators import TOPICS, make_question
from app.services.srs import CORRECT_QUALITY, WRONG_QUALITY, ReviewState, sm2

FRONTEND_TOPICS = {
    "derivative-tangent", "riemann-integral", "trig-unit-circle", "function-transforms", "probability-monte-carlo", "limit-epsilon-delta",
    "linear-transformations", "vectors", "complex-numbers", "sequences-series", "exponential-log", "statistics-clt",
    "taylor-series", "fourier-series", "differential-equations", "multivariable-calculus", "conics", "numerical-methods",
    "regression", "graph-theory",
}  # fmt: skip


def test_every_catalog_topic_has_a_generator() -> None:
    assert set(TOPICS) == FRONTEND_TOPICS


@pytest.mark.parametrize("topic", sorted(FRONTEND_TOPICS))
def test_generators_are_deterministic_and_well_formed(topic) -> None:
    for seed in range(60):
        a, b = make_question(topic, seed), make_question(topic, seed)
        assert a == b
        assert a.prompt and a.explanation and a.answer_text
        if a.kind == "number":
            assert a.answer is not None and math.isfinite(a.answer)
        else:
            assert a.options and a.correct is not None and len(set(a.options)) == len(a.options)


def _answer_for(topic: str, seed: int) -> str:
    q = make_question(topic, seed)
    return str(q.correct) if q.kind == "choice" else repr(q.answer)


@pytest.mark.parametrize("topic", sorted(FRONTEND_TOPICS))
def test_check_accepts_correct_and_rejects_wrong(client, topic) -> None:
    q = client.get(f"/api/quiz/{topic}", params={"seed": 42}).json()
    assert "answer" not in q  # cevap istemciye sızmamalı
    ok = client.post(f"/api/quiz/{topic}/check", json={"seed": 42, "answer": _answer_for(topic, 42)}).json()
    assert ok["correct"] is True
    wrong = "-99999" if q["kind"] == "number" else str((make_question(topic, 42).correct + 1) % len(q["options"]))
    bad = client.post(f"/api/quiz/{topic}/check", json={"seed": 42, "answer": wrong}).json()
    assert bad["correct"] is False
    assert bad["expected"]


def test_unknown_topic_404(client) -> None:
    assert client.get("/api/quiz/yok-boyle-konu").status_code == 404


@pytest.mark.parametrize(
    ("raw", "value"),
    [("2", 2), ("-1,5", -1.5), ("3/4", 0.75), ("π", math.pi), ("pi/2", math.pi / 2), ("2π", 2 * math.pi), ("−3", -3)],
)
def test_parse_answer(raw, value) -> None:
    assert parse_answer(raw) == pytest.approx(value)


@pytest.mark.parametrize("raw", ["", "abc", "1/0", "2+2", "__import__"])
def test_parse_answer_rejects(raw) -> None:
    assert parse_answer(raw) is None


class TestSM2:
    def test_intervals_grow_when_correct(self) -> None:
        s = ReviewState()
        intervals = []
        for _ in range(5):
            s = sm2(s, CORRECT_QUALITY)
            intervals.append(s.interval_days)
        assert intervals[:2] == [1, 3]
        assert intervals == sorted(intervals) and intervals[-1] > 15

    def test_wrong_answer_resets(self) -> None:
        s = sm2(sm2(sm2(ReviewState(), 5), 5), 5)
        s = sm2(s, WRONG_QUALITY)
        assert (s.repetitions, s.interval_days) == (0, 1)

    def test_ease_never_below_minimum(self) -> None:
        s = ReviewState()
        for _ in range(20):
            s = sm2(s, 0)
        assert s.ease == pytest.approx(1.3)
