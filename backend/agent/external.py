from __future__ import annotations

import json
import threading
import time
import urllib.parse
from typing import Any

import re

from ..config import CSDN_SEARCH_ENABLED, GITHUB_TOKEN, WEB_FETCH_ENABLED
from ..content import read_personal
from .web import FetchError, clean_html_text, fetch_html, fetch_json, fetch_page

_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL = 300
_USERNAME_CACHE: dict[str, str] = {}
MAX_RESULTS = 5

GITHUB_API = "https://api.github.com/search"
GITHUB_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
CSDN_API = "https://so.csdn.net/api/v3/search"


def _cached(key: str, loader):  # type: ignore[no-untyped-def]
    now = time.monotonic()
    with _CACHE_LOCK:
        cached = _CACHE.get(key)
        if cached and now - cached[0] < _CACHE_TTL:
            return dict(cached[1])
    value = loader()
    with _CACHE_LOCK:
        _CACHE[key] = (now, value)
    return dict(value)


def _error(message: str) -> dict[str, Any]:
    return {"error": message, "results": [], "citations": []}


def _clip(value: Any, limit: int = 500) -> str:
    text = clean_html_text(str(value or ""))
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _canonical_url(value: str) -> str:
    try:
        parsed = urllib.parse.urlsplit(value)
    except ValueError:
        return value
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return value
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def search_github(query: str, kind: str = "repositories") -> dict[str, Any]:
    query = query.strip()[:256]
    if not query:
        return _error("Empty query")
    if kind not in {"repositories", "issues", "code"}:
        return _error("kind must be repositories, issues, or code")
    if kind == "code" and not GITHUB_TOKEN:
        return _error("GitHub code search requires GITHUB_TOKEN")

    def load() -> dict[str, Any]:
        params = {"q": query, "per_page": MAX_RESULTS}
        if kind == "repositories":
            params.update({"sort": "stars", "order": "desc"})
        elif kind == "issues":
            params.update({"sort": "updated", "order": "desc"})
        headers = dict(GITHUB_HEADERS)
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        if kind == "code":
            headers["Accept"] = "application/vnd.github.text-match+json"
        url = f"{GITHUB_API}/{kind}?{urllib.parse.urlencode(params)}"
        try:
            data = fetch_json(url, headers)
        except FetchError as error:
            return _error(f"GitHub search failed: {error}")

        results: list[dict[str, Any]] = []
        citations: list[dict[str, str]] = []
        for item in (data.get("items") or [])[:MAX_RESULTS]:
            if not isinstance(item, dict):
                continue
            if kind == "repositories":
                title = str(item.get("full_name") or item.get("name") or "GitHub repository")
                url = str(item.get("html_url") or "")
                summary = _clip(item.get("description") or "")
                extra = {
                    "stars": item.get("stargazers_count"),
                    "language": item.get("language"),
                    "updated_at": item.get("updated_at"),
                }
            elif kind == "issues":
                title = str(item.get("title") or "GitHub issue")
                url = str(item.get("html_url") or "")
                summary = _clip(item.get("body") or "")
                extra = {"state": item.get("state"), "updated_at": item.get("updated_at")}
            else:
                repo = item.get("repository") if isinstance(item.get("repository"), dict) else {}
                title = f"{repo.get('full_name', 'GitHub')} · {item.get('path', '')}"
                url = str(item.get("html_url") or "")
                matches = item.get("text_matches") if isinstance(item.get("text_matches"), list) else []
                summary = _clip(" ".join(str(m.get("fragment", "")) for m in matches if isinstance(m, dict)))
                extra = {"repository": repo.get("full_name")}
            if not url:
                continue
            results.append({"title": title, "url": url, "summary": summary, **extra})
            citations.append({"label": title, "href": url, "kind": "github"})
        return {"results": results, "citations": citations, "source": "github"}

    return _cached(f"github:{kind}:{query}", load)


def search_csdn(query: str) -> dict[str, Any]:
    query = query.strip()[:200]
    if not query:
        return _error("Empty query")
    if not CSDN_SEARCH_ENABLED:
        return _error("CSDN search is disabled")

    def load() -> dict[str, Any]:
        params = {"q": query, "t": "all", "p": 1}
        url = f"{CSDN_API}?{urllib.parse.urlencode(params)}"
        headers = {
            "Referer": f"https://so.csdn.net/so/search?q={urllib.parse.quote(query)}",
            "X-Requested-With": "XMLHttpRequest",
        }
        try:
            data = fetch_json(url, headers)
        except FetchError as error:
            return _error(f"CSDN search failed: {error}")

        results: list[dict[str, Any]] = []
        citations: list[dict[str, str]] = []
        for item in (data.get("result_vos") or [])[:MAX_RESULTS]:
            if not isinstance(item, dict):
                continue
            title = _clip(item.get("title") or "CSDN article", 160)
            url = str(item.get("url_location") or item.get("url") or "")
            if not url:
                continue
            url = _canonical_url(url)
            summary = _clip(item.get("digest") or item.get("description") or "")
            results.append(
                {
                    "title": title,
                    "url": url,
                    "summary": summary,
                    "author": item.get("nickname") or item.get("author"),
                    "date": item.get("create_time_str") or item.get("update_time"),
                    "type": item.get("type") or item.get("so_type"),
                }
            )
            citations.append({"label": title, "href": url, "kind": "csdn"})
        return {"results": results, "citations": citations, "source": "csdn"}

    return _cached(f"csdn:{query}", load)


def fetch_public_url(url: str) -> dict[str, Any]:
    if not WEB_FETCH_ENABLED:
        return _error("Web fetch is disabled")
    url = url.strip()
    if not url:
        return _error("Empty URL")

    def load() -> dict[str, Any]:
        try:
            page = fetch_page(url)
        except FetchError as error:
            return _error(f"Fetch failed: {error}")
        text = str(page.get("text") or "")[:4000]
        title = str(page.get("title") or "").strip() or url
        return {
            "url": page.get("url") or url,
            "title": title,
            "content_type": page.get("content_type"),
            "text": text,
            "citations": [{"label": title, "href": page.get("url") or url, "kind": "web"}],
        }

    return _cached(f"fetch:{url}", load)


# ---------- the owner's own public profiles ----------


def _valid_username(value: str) -> str:
    username = value.strip().lstrip("@")
    if username.lower() in {"yourname", "your-name", "username", "your_username", "example"}:
        return ""
    return username if re.fullmatch(r"[A-Za-z0-9_-]{2,64}", username) else ""


def _resolve_csdn_custom_domain(host: str) -> str:
    key = host.lower()
    if key in _USERNAME_CACHE:
        return _USERNAME_CACHE[key]
    try:
        html = fetch_html(f"https://{host}/")
    except FetchError:
        return ""
    match = re.search(r'username="([A-Za-z0-9_-]{2,64})"', html)
    if not match:
        return ""
    username = _valid_username(match.group(1))
    if username:
        _USERNAME_CACHE[key] = username
    return username


def _social_username(locale: str, network: str) -> str:
    data = read_personal(locale)
    socials = data.get("socials") if isinstance(data.get("socials"), dict) else {}
    value = str(socials.get(network) or "").strip().rstrip("/")
    if not value:
        return ""

    # The CSDN profile may be a custom domain such as
    # https://fengqingyang.blog.csdn.net; the real username is in the page.
    if network == "csdn":
        normalized = value if "://" in value else f"https://{value}"
        parsed = urllib.parse.urlsplit(normalized)
        host = (parsed.hostname or "").lower()
        path = parsed.path.strip("/")
        if host in {"blog.csdn.net", "www.blog.csdn.net"}:
            return _valid_username(path.split("/")[0] if path else "")
        if host.endswith(".blog.csdn.net"):
            return _resolve_csdn_custom_domain(host)
        if "://" not in value:
            return _valid_username(value.split("/")[0])
        return ""

    if "://" not in value:
        return _valid_username(value.split("/")[0])
    parsed = urllib.parse.urlsplit(value)
    host = (parsed.hostname or "").lower()
    path = parsed.path.strip("/")
    if network == "github" and host not in {"github.com", "www.github.com"}:
        return ""
    return _valid_username(path.split("/")[0] if path else "")


def _github_user_repos(username: str, limit: int) -> dict[str, Any]:
    def load() -> dict[str, Any]:
        headers = dict(GITHUB_HEADERS)
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        url = (
            f"https://api.github.com/users/{urllib.parse.quote(username)}/repos"
            f"?sort=updated&direction=desc&per_page={max(1, min(limit, 10))}"
        )
        try:
            data = fetch_json(url, headers)
        except FetchError as error:
            return _error(f"GitHub profile fetch failed: {error}")
        if not isinstance(data, list):
            return _error("Unexpected GitHub response")
        results: list[dict[str, Any]] = []
        citations: list[dict[str, str]] = []
        for item in data[:limit]:
            if not isinstance(item, dict):
                continue
            title = str(item.get("full_name") or item.get("name") or "GitHub repository")
            url = str(item.get("html_url") or "")
            if not url:
                continue
            results.append(
                {
                    "title": title,
                    "url": url,
                    "summary": _clip(item.get("description") or ""),
                    "stars": item.get("stargazers_count"),
                    "language": item.get("language"),
                    "updated_at": item.get("updated_at"),
                }
            )
            citations.append({"label": title, "href": url, "kind": "github"})
        return {"username": username, "results": results, "citations": citations, "source": "github"}

    return _cached(f"github-user:{username}:{limit}", load)


def get_my_github(locale: str = "zh", limit: int = 5) -> dict[str, Any]:
    username = _social_username(locale, "github")
    if not username:
        return _error("GitHub profile is not configured in personal data")
    return _github_user_repos(username, max(1, min(int(limit), 10)))


def _csdn_user_articles(username: str, limit: int) -> dict[str, Any]:
    def load() -> dict[str, Any]:
        params = {
            "page": 1,
            "size": max(1, min(limit, 10)),
            "businessType": "blog",
            "username": username,
        }
        url = (
            "https://blog.csdn.net/community/home-api/v1/get-business-list?"
            + urllib.parse.urlencode(params)
        )
        headers = {
            "Referer": f"https://blog.csdn.net/{urllib.parse.quote(username)}",
            "X-Requested-With": "XMLHttpRequest",
        }
        try:
            data = fetch_json(url, headers)
        except FetchError as error:
            return _error(f"CSDN profile fetch failed: {error}")
        payload = data.get("data") if isinstance(data, dict) else None
        items = payload.get("list") if isinstance(payload, dict) else None
        if not isinstance(items, list):
            return _error("Unexpected CSDN response")
        results: list[dict[str, Any]] = []
        citations: list[dict[str, str]] = []
        for item in items[:limit]:
            if not isinstance(item, dict):
                continue
            title = _clip(item.get("title") or "CSDN article", 160)
            url = _canonical_url(str(item.get("url") or ""))
            if not url:
                continue
            results.append(
                {
                    "title": title,
                    "url": url,
                    "summary": _clip(item.get("description") or ""),
                    "views": item.get("viewCount"),
                    "likes": item.get("diggCount"),
                    "date": item.get("formatTime") or item.get("postTime"),
                    "tags": item.get("tags") or [],
                }
            )
            citations.append({"label": title, "href": url, "kind": "csdn"})
        return {
            "username": username,
            "total": payload.get("total") if isinstance(payload, dict) else None,
            "results": results,
            "citations": citations,
            "source": "csdn",
        }

    return _cached(f"csdn-user:{username}:{limit}", load)


def get_my_csdn(locale: str = "zh", limit: int = 5) -> dict[str, Any]:
    username = _social_username(locale, "csdn")
    if not username:
        return _error("CSDN profile is not configured in personal data")
    return _csdn_user_articles(username, max(1, min(int(limit), 10)))
