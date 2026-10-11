def test_health_ok(client) -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["version"]


def test_cors_allows_vite_dev_server(client) -> None:
    res = client.options(
        "/api/health",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_unknown_origin(client) -> None:
    res = client.get("/api/health", headers={"Origin": "https://kotu-site.example"})
    assert "access-control-allow-origin" not in res.headers


def test_openapi_docs_available(client) -> None:
    assert client.get("/api/openapi.json").status_code == 200
