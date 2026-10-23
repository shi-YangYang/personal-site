from __future__ import annotations

import json
import os
import re
import tempfile
import threading
from pathlib import Path
from typing import Any

import json5

from .config import (
    BLOG_DIR,
    CONTENT_DIR,
    DATA_DIR,
    LOCALES,
    MAIL_FILE,
    PERSONAL_FILE,
    VIEWS_FILE,
)

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_views_lock = threading.Lock()


# ---------- generic JSON ----------

def _read_json(path: Path, default: Any) -> Any:
    try:
        if not path.exists():
            return default
        return json.loads(path.read_text("utf-8"))
    except (OSError, ValueError):
        return default


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=f".{path.name}.", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(tmp, path)
    finally:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass


# ---------- personal ----------

def _parse_ts_personal(locale: str) -> dict[str, Any]:
    path = CONTENT_DIR / "data" / f"personal.{locale}.ts"
    try:
        text = path.read_text("utf-8")
    except OSError:
        return {}
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return {}
    source = text[start : end + 1].replace(" as const", "")
    try:
        parsed = json5.loads(source)
        return parsed if isinstance(parsed, dict) else {}
    except ValueError:
        return {}


def read_all_personal() -> dict[str, Any]:
    data = _read_json(PERSONAL_FILE, {})
    if isinstance(data, dict) and data:
        return data
    return {locale: _parse_ts_personal(locale) for locale in LOCALES}


def read_personal(locale: str) -> dict[str, Any]:
    if locale not in LOCALES:
        locale = "zh"
    base = _parse_ts_personal(locale)
    override = read_all_personal().get(locale)
    if not isinstance(override, dict):
        return base
    merged = {**base, **override}
    base_socials = base.get("socials") if isinstance(base.get("socials"), dict) else {}
    override_socials = override.get("socials") if isinstance(override.get("socials"), dict) else {}
    merged["socials"] = {**base_socials, **override_socials}
    return merged


def _as_str(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _as_str_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in (_as_str(v) for v in value) if item.strip()]


def sanitize_personal_record(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    record: dict[str, Any] = {}
    for key in (
        "name",
        "initials",
        "role",
        "tagline",
        "bio",
        "location",
        "email",
        "siteTitle",
    ):
        record[key] = _as_str(value.get(key))

    socials = value.get("socials") if isinstance(value.get("socials"), dict) else {}
    record["socials"] = {
        key: _as_str(socials.get(key)) for key in ("github", "csdn", "qq", "x")
    }

    record["skills"] = []
    for group in value.get("skills") or []:
        if not isinstance(group, dict):
            continue
        items = []
        for item in group.get("items") or []:
            if not isinstance(item, dict):
                continue
            try:
                level = float(item.get("level", 0))
            except (TypeError, ValueError):
                level = 0
            items.append({"name": _as_str(item.get("name")), "level": level})
        record["skills"].append(
            {
                "category": _as_str(group.get("category")),
                "label": _as_str(group.get("label")),
                "items": items,
            }
        )

    record["experience"] = []
    for item in value.get("experience") or []:
        if not isinstance(item, dict):
            continue
        record["experience"].append(
            {
                "company": _as_str(item.get("company")),
                "role": _as_str(item.get("role")),
                "period": _as_str(item.get("period")),
                "location": _as_str(item.get("location")),
                "description": _as_str(item.get("description")),
                "tags": _as_str_list(item.get("tags")),
            }
        )

    record["projects"] = []
    for item in value.get("projects") or []:
        if not isinstance(item, dict):
            continue
        links = item.get("links") if isinstance(item.get("links"), dict) else {}
        record["projects"].append(
            {
                "slug": _as_str(item.get("slug")),
                "title": _as_str(item.get("title")),
                "description": _as_str(item.get("description")),
                "longDescription": _as_str(item.get("longDescription")),
                "year": _as_str(item.get("year")),
                "highlights": _as_str_list(item.get("highlights")),
                "tags": _as_str_list(item.get("tags")),
                "size": "large" if item.get("size") == "large" else "small",
                "links": {
                    "demo": _as_str(links.get("demo")),
                    "code": _as_str(links.get("code")),
                },
            }
        )

    record["friendLinks"] = []
    for item in value.get("friendLinks") or []:
        if not isinstance(item, dict):
            continue
        record["friendLinks"].append(
            {
                "name": _as_str(item.get("name")),
                "url": _as_str(item.get("url")),
                "description": _as_str(item.get("description")),
            }
        )

    return record


def write_personal(payload: Any) -> None:
    if not isinstance(payload, dict):
        raise ValueError("Invalid payload")
    result: dict[str, Any] = {}
    for locale in LOCALES:
        record = sanitize_personal_record(payload.get(locale))
        if not record or not record["name"].strip():
            raise ValueError(f"Invalid data for locale: {locale}")
        result[locale] = record
    _write_json(PERSONAL_FILE, result)


# ---------- mail ----------

DEFAULT_MAIL = {
    "enabled": False,
    "host": "",
    "port": 465,
    "secure": True,
    "user": "",
    "pass": "",
    "to": "",
    "subjectPrefix": "【个人站留言】",
}


def read_mail_config() -> dict[str, Any]:
    parsed = _read_json(MAIL_FILE, {})
    return {**DEFAULT_MAIL, **parsed} if isinstance(parsed, dict) else dict(DEFAULT_MAIL)


def write_mail_config(config: dict[str, Any]) -> None:
    _write_json(MAIL_FILE, {**DEFAULT_MAIL, **config})


# ---------- views ----------

def read_views() -> dict[str, int]:
    parsed = _read_json(VIEWS_FILE, {})
    if not isinstance(parsed, dict):
        return {}
    result: dict[str, int] = {}
    for key, value in parsed.items():
        try:
            result[str(key)] = int(value)
        except (TypeError, ValueError):
            continue
    return result


def get_views(slug: str) -> int:
    return read_views().get(slug, 0)


def increment_views(slug: str) -> int:
    with _views_lock:
        views = read_views()
        next_value = views.get(slug, 0) + 1
        views[slug] = next_value
        _write_json(VIEWS_FILE, views)
        return next_value


# ---------- posts ----------

def _frontmatter_value(value: str) -> Any:
    value = value.strip()
    if not value:
        return ""
    try:
        return json.loads(value)
    except ValueError:
        if len(value) >= 2 and value[0] in "\"'" and value[-1] == value[0]:
            return value[1:-1]
        return value


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    front = text[3:end].strip("\n")
    body = text[end + 4 :].lstrip("\n")
    meta: dict[str, Any] = {}
    for line in front.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = _frontmatter_value(value)
    tags = meta.get("tags")
    if isinstance(tags, list):
        meta["tags"] = [str(item) for item in tags]
    else:
        meta["tags"] = []
    return meta, body


def _serialize_post(post: dict[str, Any]) -> str:
    tags = ", ".join(json.dumps(str(tag), ensure_ascii=False) for tag in post["tags"])
    return "\n".join(
        [
            "---",
            f"title: {json.dumps(post['title'], ensure_ascii=False)}",
            f"description: {json.dumps(post['description'], ensure_ascii=False)}",
            f"date: {json.dumps(post['date'], ensure_ascii=False)}",
            f"tags: [{tags}]",
            "---",
            "",
            str(post["content"]).strip(),
            "",
        ]
    )


def write_post(
    slug: str,
    title: str,
    description: str,
    date: str,
    tags: list[str],
    content: str,
    languages: list[str],
) -> dict[str, Any]:
    slug = slug.strip().lower()
    if not SLUG_RE.fullmatch(slug):
        raise ValueError("Invalid slug: use lowercase letters, numbers and hyphens")
    selected = [lang for lang in languages if lang in LOCALES]
    if not selected:
        raise ValueError("Pick at least one language")
    if not title.strip() or not date.strip():
        raise ValueError("slug, title and date are required")

    written: list[str] = []
    paths: list[str] = []
    for locale in selected:
        directory = BLOG_DIR / locale
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / f"{slug}.mdx"
        path.write_text(
            _serialize_post(
                {
                    "title": title.strip(),
                    "description": description.strip(),
                    "date": date.strip(),
                    "tags": [tag.strip() for tag in tags if tag.strip()],
                    "content": content,
                }
            ),
            "utf-8",
        )
        written.append(locale)
        paths.append(f"/{locale}/blog/{slug}")
    return {"written": written, "paths": paths}


def list_posts(locale: str) -> list[dict[str, Any]]:
    directory = BLOG_DIR / locale
    if not directory.is_dir():
        return []
    posts: list[dict[str, Any]] = []
    for path in sorted(directory.glob("*.mdx")):
        try:
            meta, body = parse_frontmatter(path.read_text("utf-8"))
        except OSError:
            continue
        posts.append(
            {
                "slug": path.stem,
                "title": str(meta.get("title", path.stem)),
                "description": str(meta.get("description", "")),
                "date": str(meta.get("date", "")),
                "tags": meta.get("tags", []),
                "body": body,
                "href": f"/{locale}/blog/{path.stem}",
            }
        )
    posts.sort(key=lambda item: item["date"], reverse=True)
    return posts


# ---------- favicon ----------

FAVICON_CANDIDATES = (
    ("favicon.ico", "image/x-icon"),
    ("favicon.png", "image/png"),
    ("favicon.svg", "image/svg+xml"),
    ("icon.png", "image/png"),
)


def favicon_candidate() -> tuple[Path, str] | None:
    for name, media_type in FAVICON_CANDIDATES:
        path = DATA_DIR / name
        if path.is_file():
            return path, media_type
    return None
