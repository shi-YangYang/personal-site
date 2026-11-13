from __future__ import annotations

import logging
import os
import re
import threading
import time
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from . import agent_graph
from .agent_config import is_llm_configured, mask_agent_config, read_agent_config, write_agent_config
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
)
from .limits import AgentLimiter
from .mail import send_contact_mail
from .model_provider import list_models, test_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("personal-site.api")

app = FastAPI(title="personal-site API", version="1.0.0")

_cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_lock = threading.Lock()
_rate_buckets: dict[str, list[float]] = {}
_agent_limiter = AgentLimiter()


def _client_ip(request: Request) -> str:
    peer = request.client.host if request.client else "unknown"
    # Caddy is the only trusted proxy in the single-container deployment.
    if peer in {"127.0.0.1", "::1"}:
        real_ip = request.headers.get("x-real-ip", "").strip()
        if real_ip:
            return real_ip
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[-1].strip()
    return peer


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
    session_id: Optional[str] = Field(
        default=None,
        min_length=8,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
    )


class ContactBody(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class LoginBody(BaseModel):
    password: str = Field(min_length=1, max_length=500)


class AgentConfigBody(BaseModel):
    base_url: str = Field(min_length=1, max_length=500)
    model: str = Field(min_length=1, max_length=200)
    api_key: str = Field(default="", max_length=500)


class AgentProbeBody(BaseModel):
    base_url: str = Field(default="", max_length=500)
    model: str = Field(default="", max_length=200)
    api_key: str = Field(default="", max_length=500)


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
    mode = "llm" if is_llm_configured() else "local"
    return {"status": "ok", "mode": mode}


@app.post("/api/agent/ask")
def agent_ask(body: AskBody, request: Request) -> Any:
    locale = body.locale if body.locale in LOCALES else "zh"
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    decision = _agent_limiter.begin(_client_ip(request))
    if not decision.allowed:
        message = (
            "请求太频繁，请稍后再试。"
            if locale == "zh"
            else "Too many requests. Try again shortly."
        )
        return JSONResponse(
            {"error": message, "retryAfter": decision.retry_after},
            status_code=429,
            headers={"Retry-After": str(decision.retry_after)},
        )

    try:
        result = agent_graph.ask(question, locale, body.session_id)
    except Exception as error:  # pragma: no cover - defensive
        log.exception("agent failed")
        raise HTTPException(status_code=500, detail="Agent is temporarily unavailable") from error
    finally:
        _agent_limiter.end()

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


@app.get("/api/admin/agent")
def admin_agent_get(request: Request) -> dict[str, Any]:
    require_admin(request)
    return mask_agent_config()


@app.post("/api/admin/agent")
def admin_agent_save(body: AgentConfigBody, request: Request) -> dict[str, Any]:
    require_admin(request)
    base_url = body.base_url.strip().rstrip("/")
    model = body.model.strip()
    if not re.match(r"^https?://", base_url):
        raise HTTPException(status_code=400, detail="Base URL must start with http:// or https://")
    current = read_agent_config()
    api_key = body.api_key.strip() or current.get("api_key", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")
    write_agent_config({"base_url": base_url, "api_key": api_key, "model": model})
    return mask_agent_config()


def _probe_config(body: AgentProbeBody) -> dict[str, str]:
    current = read_agent_config()
    return {
        "base_url": (body.base_url.strip() or current.get("base_url", "")).rstrip("/"),
        "api_key": body.api_key.strip() or current.get("api_key", ""),
        "model": body.model.strip() or current.get("model", ""),
    }


@app.post("/api/admin/agent/test")
def admin_agent_test(body: AgentProbeBody, request: Request) -> dict[str, Any]:
    require_admin(request)
    config = _probe_config(body)
    if not config["base_url"] or not config["api_key"] or not config["model"]:
        raise HTTPException(status_code=400, detail="Base URL, API key and model are required")
    try:
        return test_model(config["base_url"], config["api_key"], config["model"])
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/admin/agent/models")
def admin_agent_models(body: AgentProbeBody, request: Request) -> dict[str, Any]:
    require_admin(request)
    config = _probe_config(body)
    if not config["base_url"] or not config["api_key"]:
        raise HTTPException(status_code=400, detail="Base URL and API key are required")
    try:
        models = list_models(config["base_url"], config["api_key"])
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"models": models}


@app.get("/api/admin/session")
def session_state(request: Request) -> dict[str, bool]:
    return {"authenticated": has_valid_session(request), "configured": is_configured()}
