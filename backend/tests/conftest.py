import os
import tempfile
from pathlib import Path

# Uygulama içe aktarılmadan önce test ayarları: geçici veritabanı, oran sınırı kapalı.
_tmp = Path(tempfile.mkdtemp(prefix="matlab-test-"))
os.environ["MATLAB_DATABASE_URL"] = f"sqlite:///{(_tmp / 'test.db').as_posix()}"
os.environ["MATLAB_RATE_LIMIT_ENABLED"] = "false"
os.environ["MATLAB_SYMPY_WORKERS"] = "1"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    # Bağlam yöneticisi lifespan'i çalıştırır → Alembic göçleri uygulanır.
    with TestClient(app) as c:
        yield c


_counter = iter(range(1, 10_000))


@pytest.fixture
def user(client):
    """Yeni bir kullanıcı oluşturur; (istemci başlıkları, kullanıcı adı) döndürür."""
    name = f"ogrenci{next(_counter)}"
    res = client.post("/api/auth/register", json={"username": name, "password": "guclu-parola-123", "consent": True})
    assert res.status_code == 201, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, name
