from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI


def _model(base_url: str, api_key: str, model: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        temperature=0,
        max_tokens=8,
        timeout=15,
        max_retries=0,
    )


def list_models(base_url: str, api_key: str) -> list[str]:
    url = f"{base_url.rstrip('/')}/models"
    request = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise ValueError(f"模型列表接口返回 HTTP {error.code}") from error
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise ValueError(f"无法获取模型列表: {error}") from error

    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, list):
        raise ValueError("模型列表响应格式不正确")
    ids = sorted(
        {
            str(item.get("id"))
            for item in data
            if isinstance(item, dict) and item.get("id")
        }
    )
    return ids[:200]


def test_model(base_url: str, api_key: str, model: str) -> dict[str, Any]:
    started = time.perf_counter()
    response = _model(base_url, api_key, model).invoke(
        [HumanMessage(content="Reply with exactly: OK")]
    )
    elapsed = round((time.perf_counter() - started) * 1000)
    content = response.content
    if not isinstance(content, str) or not content.strip():
        raise ValueError("模型返回了空响应")
    return {"model": model, "latencyMs": elapsed, "preview": content.strip()[:120]}
