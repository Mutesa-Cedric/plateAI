"""Content-addressed in-memory cache for the AI core.

Keys are derived from the canonical content that actually reaches a model
(or, for scans, from a normalized image fingerprint). When that content
changes the key changes; there is no invalidation API.
"""
from __future__ import annotations

import hashlib
import json
import logging
import threading
from typing import Any, Callable, Optional

from cachetools import LRUCache

from config import Config

log = logging.getLogger("plateai.core")


def _json_default(value: Any) -> Any:
    if isinstance(value, (bytes, bytearray, memoryview)):
        return hashlib.sha256(bytes(value)).hexdigest()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    raise TypeError(f"unserializable type: {type(value)!r}")


def content_key(namespace: str, *parts: Any) -> str:
    """Stable SHA-256 of namespace + canonical JSON of the content parts."""
    payload = json.dumps(
        {"ns": namespace, "parts": parts},
        sort_keys=True,
        separators=(",", ":"),
        default=_json_default,
        ensure_ascii=False,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class ContentCache:
    """Thread-safe LRU. Get/set only — no delete/invalidate."""

    def __init__(self, maxsize: int) -> None:
        self._lock = threading.Lock()
        self._store: LRUCache = LRUCache(maxsize=max(1, maxsize))

    def get(self, key: str) -> Any:
        with self._lock:
            if key not in self._store:
                return None
            return self._store[key]

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = value

    def __contains__(self, key: str) -> bool:
        with self._lock:
            return key in self._store

    def __len__(self) -> int:
        with self._lock:
            return len(self._store)

    def clear(self) -> None:
        """Drop every entry. Intended for tests, not production invalidation."""
        with self._lock:
            self._store.clear()


_ai_cache: Optional[ContentCache] = None
_ai_cache_lock = threading.Lock()


def get_ai_cache() -> ContentCache:
    global _ai_cache
    if _ai_cache is None:
        with _ai_cache_lock:
            if _ai_cache is None:
                _ai_cache = ContentCache(maxsize=Config.AI_CACHE_MAXSIZE)
    return _ai_cache


def reset_ai_cache() -> None:
    get_ai_cache().clear()


def log_cache(event: str, namespace: str, key: str, **extra: Any) -> None:
    """Log a cache hit or miss. `event` is 'hit' or 'miss'."""
    meta = " ".join(f"{k}={v}" for k, v in extra.items())
    suffix = f" {meta}" if meta else ""
    log.info(
        "cache %s ns=%s key=%s%s",
        event,
        namespace,
        key[:16],
        suffix,
    )


def cached_get_or_set(
    namespace: str,
    key_material: Any,
    producer: Callable[[], Any],
) -> Any:
    """Return a cached value or produce, store, and return it.

    Logs every hit and miss. The key is a hash of `key_material` only —
    callers must pass the same canonical content the model will see.
    """
    key = content_key(namespace, key_material)
    cache = get_ai_cache()
    hit = cache.get(key)
    if hit is not None:
        log_cache("hit", namespace, key)
        return hit
    log_cache("miss", namespace, key)
    value = producer()
    cache.set(key, value)
    return value
