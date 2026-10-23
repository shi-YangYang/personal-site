from __future__ import annotations

import logging
import re
import threading
import time
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from . import agent
from .auth import (
    has_valid_session,
    is_configured,
    require_admin,
    session_token,
    verify_password,
)
from .config import (
    ADMIN_COOKIE,
    ADMIN_TTL_SECONDS,
    COOKIE_SECURE,
    LOCALES,
)
from .content import (
    favicon_candidate,
    get_views,
    increment_views,
    read_all_personal,
    read_mail_config,
    read_personal,
    write_mail_config,
    write_personal,
    write_post,
)
from .mail import send_contact_mail

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("personal-site.api")

app = FastAPI(title="personal-site API", version="1.0.0")

_rate_lock = threading.Lock()
_rate_buckets: dict[str, list[float]] = {}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limit(key: str, limit: int, window: int = 60) -> None:
    now = time.time()
    with _rate_lock:
        bucket = [stamp for stamp in _rate_buckets.get(key, []) if now - stamp < window]
        if len(bucket) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests, try again later")
        bucket.append(now)
        _rate_buckets[key] = bucket


@app.exception_handler(HTTPException)
async def _http_exception(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)


class AskBody(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    locale: str = "zh"


class ContactBody(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class LoginBody(BaseModel):
    password: str = Field(min_length=1, max_length=500)


class MailBody(BaseModel):
    enabled: bool = False
    host: str = ""
    port: int = 465
    secure: bool = True
    user: str = ""
    pass_: str = Field(default="", alias="pass")
    to: str = ""
    subjectPrefix: str = "【个人站留言】"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/agent/health")
def agent_health() -> dict[str, str]:
    mode = "llm" if agent.AGENT_LLM_BASE_URL and agent.AGENT_LLM_API_KEY else "local"
    return {"status": "ok", "mode": mode}


@app.post("/api/agent/ask")
def agent_ask(body: AskBody, request: Request) -> dict[str, Any]:
    _rate_limit(f"agent:{_client_ip(request)}", 20)
    locale = body.locale if body.locale in LOCALES else "zh"
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    try:
        result = agent.ask(question, locale)
    except Exception as error:  # pragma: no cover - defensive
        log.exception("agent failed")
        raise HTTPException(status_code=500, detail="Agent is temporarily unavailable") from error
    return {"question": question, "locale": locale, **result}


@app.post("/api/contact")
def contact(body: ContactBody, request: Request) -> dict[str, bool]:
    _rate_limit(f"contact:{_client_ip(request)}", 5)
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", body.email):
        raise HTTPException(status_code=400, detail="Invalid email address")
    name = body.name.strip()
    email = body.email.strip()
    message = body.message.strip()
    if not name or not message:
        raise HTTPException(status_code=400, detail="Missing required fields")
    try:
        send_contact_mail(name, email, message)
    except Exception:
        log.exception("contact mail failed")
    log.info("[contact] %s <%s> %s", name, email, message[:160])
    return {"ok": True}


@app.get("/api/views/{slug}")
def views_get(slug: str) -> dict[str, Any]:
    return {"slug": slug, "views": get_views(slug)}


@app.post("/api/views/{slug}")
def views_post(slug: str, request: Request) -> dict[str, Any]:
    _rate_limit(f"views:{_client_ip(request)}:{slug}", 10)
    return {"slug": slug, "views": increment_views(slug)}


@app.get("/api/favicon")
def favicon() -> Response:
    candidate = favicon_candidate()
    if not candidate:
        return Response("Not Found", status_code=404)
    path, media_type = candidate
    return Response(
        content=path.read_bytes(),
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.post("/api/admin/login")
def login(body: LoginBody) -> JSONResponse:
    if not is_configured():
        raise HTTPException(status_code=503, detail="ADMIN_PASSWORD not configured")
    if not verify_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    response = JSONResponse({"ok": True})
    response.set_cookie(
        ADMIN_COOKIE,
        session_token(),
        max_age=ADMIN_TTL_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return response


@app.post("/api/admin/logout")
def logout() -> JSONResponse:
    response = JSONResponse({"ok": True})
    response.delete_cookie(ADMIN_COOKIE, path="/")
    return response


@app.get("/api/admin/personal")
def personal_get(request: Request) -> dict[str, Any]:
    require_admin(request)
    return {locale: read_personal(locale) for locale in LOCALES}


@app.post("/api/admin/personal")
def personal_post(body: dict[str, Any], request: Request) -> dict[str, bool]:
    require_admin(request)
    try:
        write_personal(body)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"ok": True}


@app.get("/api/admin/mail")
def mail_get(request: Request) -> dict[str, Any]:
    require_admin(request)
    config = read_mail_config()
    return {**config, "pass": "", "passSet": bool(config.get("pass"))}


@app.post("/api/admin/mail")
def mail_post(body: MailBody, request: Request) -> dict[str, bool]:
    require_admin(request)
    current = read_mail_config()
    incoming_pass = body.pass_ if body.pass_ else current.get("pass", "")
    config = {
        "enabled": bool(body.enabled),
        "host": body.host.strip(),
        "port": int(body.port or 465),
        "secure": bool(body.secure),
        "user": body.user.strip(),
        "pass": incoming_pass,
        "to": body.to.strip(),
        "subjectPrefix": body.subjectPrefix.strip() or "【个人站留言】",
    }
    if config["enabled"] and not (config["host"] and config["user"] and config["pass"]):
        raise HTTPException(status_code=400, detail="启用时需填写 SMTP 服务器、邮箱和授权码")
    write_mail_config(config)
    return {"ok": True}


class PostBody(BaseModel):
    slug: str = ""
    title: str = ""
    description: str = ""
    date: str = ""
    tags: list[str] = Field(default_factory=list)
    content: str = ""
    languages: list[str] = Field(default_factory=list)


@app.post("/api/admin/posts")
def posts_post(body: PostBody, request: Request) -> dict[str, Any]:
    require_admin(request)
    try:
        result = write_post(
            slug=body.slug,
            title=body.title,
            description=body.description,
            date=body.date,
            tags=body.tags,
            content=body.content,
            languages=body.languages,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"ok": True, "slug": body.slug.strip().lower(), "languages": result["written"]}


@app.get("/api/admin/session")
def session_state(request: Request) -> dict[str, bool]:
    return {"authenticated": has_valid_session(request), "configured": is_configured()}
