from app.services.quiz.generators import make_question


def _cookie(res) -> str:
    return res.cookies.get("matlab_refresh")


def _with_cookie(client, token: str):
    client.cookies.clear()
    client.cookies.set("matlab_refresh", token)
    return client


class TestAuth:
    def test_register_requires_consent(self, client) -> None:
        res = client.post("/api/auth/register", json={"username": "onaysiz", "password": "parola-12345", "consent": False})
        assert res.status_code == 422

    def test_username_rules(self, client) -> None:
        res = client.post("/api/auth/register", json={"username": "Bad Name!", "password": "parola-12345", "consent": True})
        assert res.status_code == 422

    def test_short_password_rejected(self, client) -> None:
        res = client.post("/api/auth/register", json={"username": "kisaparola", "password": "123", "consent": True})
        assert res.status_code == 422

    def test_duplicate_username(self, client, user) -> None:
        _, name = user
        res = client.post("/api/auth/register", json={"username": name, "password": "baska-parola-1", "consent": True})
        assert res.status_code == 409

    def test_login_and_me(self, client, user) -> None:
        _, name = user
        res = client.post("/api/auth/login", json={"username": name.upper(), "password": "guclu-parola-123"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.json()["username"] == name

    def test_wrong_password(self, client, user) -> None:
        _, name = user
        assert client.post("/api/auth/login", json={"username": name, "password": "yanlis-parola"}).status_code == 401
        assert client.post("/api/auth/login", json={"username": "olmayan-kisi", "password": "yanlis-parola"}).status_code == 401

    def test_protected_routes_need_token(self, client) -> None:
        assert client.get("/api/auth/me").status_code == 401
        assert client.get("/api/me/summary", headers={"Authorization": "Bearer bozuk.token"}).status_code == 401

    def test_refresh_rotates_and_old_token_dies(self, client, user) -> None:
        _, name = user
        login = client.post("/api/auth/login", json={"username": name, "password": "guclu-parola-123"})
        old = _cookie(login)
        client.cookies.clear()
        first = _with_cookie(client, old).post("/api/auth/refresh")
        assert first.status_code == 200
        client.cookies.clear()
        again = _with_cookie(client, old).post("/api/auth/refresh")
        assert again.status_code == 401  # tek kullanımlık
        client.cookies.clear()

    def test_logout_revokes(self, client, user) -> None:
        _, name = user
        token = _cookie(client.post("/api/auth/login", json={"username": name, "password": "guclu-parola-123"}))
        client.cookies.clear()
        assert _with_cookie(client, token).post("/api/auth/logout").status_code == 204
        client.cookies.clear()
        assert _with_cookie(client, token).post("/api/auth/refresh").status_code == 401
        client.cookies.clear()

    def test_delete_account_removes_everything(self, client, user) -> None:
        headers, name = user
        client.put("/api/progress/derivative-tangent", json={"completed_steps": [0]}, headers=headers)
        assert client.delete("/api/auth/me", headers=headers).status_code == 204
        assert client.post("/api/auth/login", json={"username": name, "password": "guclu-parola-123"}).status_code == 401
        client.cookies.clear()


class TestProgress:
    def test_sync_merges_without_losing_data(self, client, user) -> None:
        headers, _ = user
        a = {"completed_steps": [0, 1], "predictions": {"1": True}, "solved_challenges": ["x"], "totals": {"steps": 5, "challenges": 3}}
        b = {"completed_steps": [2], "predictions": {"1": False, "2": False}, "solved_challenges": ["y"], "totals": {"steps": 5, "challenges": 3}}
        client.put("/api/progress/trig-unit-circle", json=a, headers=headers)
        res = client.put("/api/progress/trig-unit-circle", json=b, headers=headers).json()
        p = res["sims"]["trig-unit-circle"]
        assert p["completed_steps"] == [0, 1, 2]
        assert p["predictions"] == {"1": True, "2": False}  # ilk tahmin korunur
        assert p["solved_challenges"] == ["x", "y"]
        assert p["mastery"] == round(0.4 * 3 / 5 + 0.6 * 2 / 3, 4)

    def test_badges_awarded(self, client, user) -> None:
        headers, _ = user
        sims = {
            sid: {"completed_steps": [0, 1, 2, 3, 4], "predictions": {str(i): True for i in range(5)}, "solved_challenges": ["a", "b", "c"], "totals": {"steps": 5, "challenges": 3}}
            for sid in ["derivative-tangent", "riemann-integral", "trig-unit-circle", "function-transforms", "probability-monte-carlo", "limit-epsilon-delta"]
        }
        res = client.post("/api/progress/sync", json={"sims": sims}, headers=headers).json()
        assert {"ilk-adim", "kasif", "tahmin-ustasi", "gorev-avcisi", "kademe-1"} <= set(res["new_badges"])
        again = client.post("/api/progress/sync", json={"sims": sims}, headers=headers).json()
        assert again["new_badges"] == []  # rozet bir kez verilir

    def test_invalid_sim_id(self, client, user) -> None:
        headers, _ = user
        assert client.put("/api/progress/..%2Fetc", json={}, headers=headers).status_code in (404, 422)


class TestReviewQueue:
    def test_quiz_feeds_spaced_repetition(self, client, user) -> None:
        headers, _ = user
        q = make_question("vectors", 3)
        ans = str(q.correct) if q.kind == "choice" else repr(q.answer)
        res = client.post("/api/quiz/vectors/check", json={"seed": 3, "answer": ans}, headers=headers).json()
        assert res["correct"] and res["next_review_days"] == 1

        wrong = client.post("/api/quiz/conics/check", json={"seed": 1, "answer": "-12345"}, headers=headers).json()
        assert wrong["correct"] is False and wrong["next_review_days"] == 1

        items = {i["topic"]: i for i in client.get("/api/me/review", headers=headers).json()}
        assert set(items) == {"vectors", "conics"}
        assert items["vectors"]["repetitions"] == 1
        assert items["conics"]["repetitions"] == 0

        summary = client.get("/api/me/summary", headers=headers).json()
        assert summary["stats"]["quiz_total"] == 2
        assert summary["stats"]["quiz_correct"] == 1
        assert len(summary["badges"]) == 8

    def test_anonymous_quiz_is_not_recorded(self, client) -> None:
        res = client.post("/api/quiz/vectors/check", json={"seed": 3, "answer": "0"}).json()
        assert res["next_review_days"] is None
