from __future__ import annotations

import hashlib
import hmac

from fastapi import HTTPException, Request

from .config import ADMIN_COOKIE, ADMIN_PASSWORD, ADMIN_SESSION_SALT


def is_configured() -> bool:
    return bool(ADMIN_PASSWORD)


def _sha256(value: str) -> bytes:
    return hashlib.sha256(value.encode("utf-8")).digest()


def verify_password(candidate: str) -> bool:
    if not ADMIN_PASSWORD:
        return False
    return hmac.compare_digest(_sha256(candidate), _sha256(ADMIN_PASSWORD))


def session_token() -> str:
    """Keep this token identical to lib/admin.ts in the Next app."""
    return hashlib.sha256(
        f"{ADMIN_PASSWORD}:{ADMIN_SESSION_SALT}".encode("utf-8")
    ).hexdigest()


def has_valid_session(request: Request) -> bool:
    token = request.cookies.get(ADMIN_COOKIE, "")
    return bool(token) and hmac.compare_digest(token, session_token())


def require_admin(request: Request) -> None:
    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="ADMIN_PASSWORD not configured on the server",
        )
    if not has_valid_session(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
