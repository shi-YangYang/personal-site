from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

from .config import AGENT_LLM_API_KEY, AGENT_LLM_BASE_URL, AGENT_MODEL, DATA_DIR

AGENT_CONFIG_FILE = DATA_DIR / "agent.json"


def _defaults() -> dict[str, str]:
    return {
        "base_url": AGENT_LLM_BASE_URL,
        "api_key": AGENT_LLM_API_KEY,
        "model": AGENT_MODEL,
    }


def read_agent_config() -> dict[str, str]:
    defaults = _defaults()
    try:
        if not AGENT_CONFIG_FILE.exists():
            return defaults
        parsed = json.loads(AGENT_CONFIG_FILE.read_text("utf-8"))
    except (OSError, ValueError):
        return defaults
    if not isinstance(parsed, dict):
        return defaults
    return {
        "base_url": str(parsed.get("base_url") or "").strip(),
        "api_key": str(parsed.get("api_key") or "").strip(),
        "model": str(parsed.get("model") or "").strip(),
    }


def write_agent_config(config: dict[str, str]) -> None:
    AGENT_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".agent.", dir=str(AGENT_CONFIG_FILE.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(
                {
                    "base_url": config.get("base_url", "").strip(),
                    "api_key": config.get("api_key", "").strip(),
                    "model": config.get("model", "").strip(),
                },
                handle,
                ensure_ascii=False,
                indent=2,
            )
            handle.write("\n")
        os.chmod(tmp, 0o600)
        os.replace(tmp, AGENT_CONFIG_FILE)
    finally:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass


def mask_agent_config(config: dict[str, str] | None = None) -> dict[str, Any]:
    value = config or read_agent_config()
    return {
        "baseUrl": value.get("base_url", ""),
        "model": value.get("model", ""),
        "apiKeySet": bool(value.get("api_key")),
    }


def is_llm_configured() -> bool:
    config = read_agent_config()
    return bool(config.get("base_url") and config.get("api_key"))
