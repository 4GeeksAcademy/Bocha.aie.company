from __future__ import annotations

import threading
import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")


class TTLCache:
    """Caché en memoria por proceso con expiración obligatoria por entrada."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        # Los endpoints síncronos de FastAPI se ejecutan en un threadpool.
        self._lock = threading.Lock()
        self._generation = 0

    def get_or_set(self, key: str, ttl_seconds: float, loader: Callable[[], T]) -> T:
        now = time.monotonic()
        with self._lock:
            hit = self._store.get(key)
            if hit is not None and hit[0] > now:
                return hit[1]
            generation = self._generation

        value = loader()
        with self._lock:
            # Si hubo una invalidación mientras se cargaba, el valor puede estar obsoleto.
            if generation == self._generation:
                self._store[key] = (time.monotonic() + ttl_seconds, value)
        return value

    def invalidate_prefix(self, prefix: str) -> None:
        with self._lock:
            self._generation += 1
            for key in [key for key in self._store if key.startswith(prefix)]:
                del self._store[key]

    def clear(self) -> None:
        with self._lock:
            self._generation += 1
            self._store.clear()


cache = TTLCache()
