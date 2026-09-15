import pytest

from services.api.database import get_db


@pytest.fixture
def isolated_database(tmp_path, monkeypatch):
    monkeypatch.setenv("SUPPLIERS_DB_PATH", str(tmp_path / "test.json"))
    get_db.cache_clear()
    yield
    get_db().close()
    get_db.cache_clear()