"""Normalize meal-scan images so retries and re-encodes share one cache key."""
from __future__ import annotations

import base64
import hashlib
import io
import logging
import re

from PIL import Image, UnidentifiedImageError

log = logging.getLogger("plateai.core")

_DATA_URI_RE = re.compile(r"^data:image/[^;]+;base64,", re.IGNORECASE)


def decode_image_input(image: bytes | None = None, b64: str | None = None) -> bytes:
    """Accept raw bytes or base64 (optionally a data-URI) and return bytes."""
    if image:
        return bytes(image)
    raw = (b64 or "").strip()
    raw = _DATA_URI_RE.sub("", raw)
    raw = re.sub(r"\s+", "", raw)
    if not raw:
        return b""
    return base64.b64decode(raw)


def normalize_image_bytes(raw: bytes) -> bytes:
    """RGB pixel payload used as the scan-cache identity.

    Converts any decodable raster to RGB and drops EXIF / format wrappers.
    Two encodings of the same pixels (JPEG vs PNG, data-URI vs raw) collapse
    to the same bytes, so the cache key is stable.
    """
    if not raw:
        return b""
    try:
        img = Image.open(io.BytesIO(raw))
        img = img.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        log.debug("image normalize fallback to raw hash: %s", exc)
        return raw
    header = f"{img.size[0]}x{img.size[1]}|".encode("ascii")
    return header + img.tobytes()


def image_fingerprint(raw: bytes) -> str:
    normalized = normalize_image_bytes(raw)
    return hashlib.sha256(normalized).hexdigest()
