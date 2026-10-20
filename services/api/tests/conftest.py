import os
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Se aísla el almacenamiento para no tocar los datos reales del repositorio.
_TMP = tempfile.mkdtemp(prefix="serialization-audit-")
os.environ["JWT_SECRET"] = "test-secret"
os.environ["SUPPLIERS_DB_PATH"] = str(Path(_TMP) / "db.json")
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(_TMP) / 'inventory.db').as_posix()}"

from fastapi.testclient import TestClient  # noqa: E402

from services.api.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def auth_headers(client):
    payload = {
        "email": "audit@example.com",
        "password": "supersecret1",
        "profile": {"name": "Audit", "phone": "3001112222", "address": "Calle 1 # 2"},
    }
    assert client.post("/users", json=payload).status_code == 201
    login = client.post(
        "/auth/login",
        data={"username": "audit@example.com", "password": "supersecret1"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}
