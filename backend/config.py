from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
BLOG_DIR = CONTENT_DIR / "blog"
DATA_DIR = ROOT / "data"
PUBLIC_DIR = ROOT / "public"
PERSONAL_FILE = DATA_DIR / "personal.local.json"
MAIL_FILE = DATA_DIR / "mail.json"
VIEWS_FILE = DATA_DIR / "views.json"

LOCALES = ("zh", "en")
DEFAULT_LOCALE = "zh"

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_SESSION_SALT = os.environ.get("ADMIN_SESSION_SALT", "personal-site")
ADMIN_COOKIE = "admin_session"
ADMIN_TTL_SECONDS = 7 * 24 * 60 * 60

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

AGENT_LLM_BASE_URL = os.environ.get("AGENT_LLM_BASE_URL", "").rstrip("/")
AGENT_LLM_API_KEY = os.environ.get("AGENT_LLM_API_KEY", "")
AGENT_MODEL = os.environ.get("AGENT_MODEL", "deepseek-chat")
