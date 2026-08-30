from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import os

from tinydb import TinyDB
from tinydb.table import Table


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "suppliers_db.json"


@lru_cache(maxsize=1)
def get_db() -> TinyDB:
    db_path = Path(os.getenv("SUPPLIERS_DB_PATH", str(DEFAULT_DB_PATH)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return TinyDB(db_path)


def get_suppliers_table() -> Table:
    return get_db().table("suppliers")
