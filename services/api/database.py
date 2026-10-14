from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import os

from tinydb import TinyDB
from tinydb.table import Table

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "suppliers_db.json"
ENV_PATH = Path(__file__).resolve().parent / ".env"


load_dotenv(ENV_PATH)


@lru_cache(maxsize=1)
def get_db() -> TinyDB:
    db_path = Path(os.getenv("SUPPLIERS_DB_PATH", str(DEFAULT_DB_PATH)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return TinyDB(db_path)


def get_suppliers_table() -> Table:
    return get_db().table("suppliers")


def get_users_table() -> Table:
    return get_db().table("users")


def get_profiles_table() -> Table:
    return get_db().table("profiles")


def get_password_resets_table() -> Table:
    return get_db().table("password_resets")


def get_password_reset_audit_table() -> Table:
    return get_db().table("password_reset_audit")


def get_incidents_table() -> Table:
    return get_db().table("incidents")

@lru_cache(maxsize=1)
def get_engine():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL no está configurada")

    engine_kwargs = {
        "echo": False,
        "pool_pre_ping": True,
    }

    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    return create_engine(
        database_url,
        **engine_kwargs,
    )


def init_inventory_db() -> None:
    from sqlmodel import SQLModel

    SQLModel.metadata.create_all(get_engine())


def get_session():
    with Session(get_engine()) as session:
        yield session