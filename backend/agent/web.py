from __future__ import annotations

import gzip
import ipaddress
import json
import re
import socket
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from typing import Any

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 "
    "PersonalSiteAgent/1.0"
)
DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}
TIMEOUT = 10
MAX_BYTES = 1_500_000
MAX_CHARS = 6000
CACHE_TTL = 300
ALLOWED_PORTS = {80, 443}

_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_LOCK = threading.Lock()
_TAG_RE = re.compile(r"<[^>]+>")


class FetchError(RuntimeError):
    pass


def _validate_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise FetchError("Only http and https URLs are allowed")
    if not parsed.hostname:
        raise FetchError("URL must include a hostname")
    if parsed.username or parsed.password:
        raise FetchError("Credentials in URLs are not allowed")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    if port not in ALLOWED_PORTS:
        raise FetchError("Only standard HTTP/HTTPS ports are allowed")
    host = parsed.hostname.lower().rstrip(".")
    if host in {"localhost", "localhost.localdomain"} or host.endswith(".local"):
        raise FetchError("Private or local hosts are not allowed")
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except OSError as error:
        raise FetchError(f"Could not resolve host: {host}") from error
    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_reserved
            or address.is_multicast
            or address.is_unspecified
        ):
            raise FetchError("Private or reserved addresses are not allowed")
    return url


class _SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        _validate_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_OPENER = urllib.request.build_opener(_SafeRedirectHandler)


def _decode_body(raw: bytes, content_encoding: str) -> bytes:
    encoding = content_encoding.lower()
    if encoding == "gzip":
        return gzip.decompress(raw)
    if encoding == "deflate":
        try:
            return zlib.decompress(raw)
        except zlib.error:
            return zlib.decompress(raw, -zlib.MAX_WBITS)
    return raw


class _TextExtractor(HTMLParser):
    BLOCK_TAGS = {
        "p", "div", "section", "article", "main", "header", "footer",
        "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "br", "pre",
    }
    SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "iframe"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.parts: list[str] = []
        self._skip = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.SKIP_TAGS:
            self._skip += 1
        elif tag == "title":
            self._in_title = True
        elif tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP_TAGS and self._skip:
            self._skip -= 1
        elif tag == "title":
            self._in_title = False
        elif tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        if self._in_title:
            self.title += data
        else:
            self.parts.append(data)

    def text(self) -> str:
        value = "".join(self.parts)
        value = re.sub(r"[ \t\f\v]+", " ", value)
        value = re.sub(r"\n\s*\n+", "\n\n", value)
        return value.strip()


def _extract_text(body: str, content_type: str) -> tuple[str, str]:
    if "json" in content_type:
        try:
            return "", json.dumps(json.loads(body), ensure_ascii=False, indent=2)[:MAX_CHARS]
        except ValueError:
            return "", body[:MAX_CHARS]
    parser = _TextExtractor()
    parser.feed(body)
    title = re.sub(r"\s+", " ", parser.title).strip()
    return title, parser.text()[:MAX_CHARS]


def _request(url: str, headers: dict[str, str] | None = None) -> tuple[str, str, bytes]:
    _validate_url(url)
    request_headers = {**DEFAULT_HEADERS, **(headers or {})}
    request = urllib.request.Request(url, headers=request_headers, method="GET")
    try:
        with _OPENER.open(request, timeout=TIMEOUT) as response:
            final_url = response.geturl()
            _validate_url(final_url)
            content_type = response.headers.get("Content-Type", "")
            content_encoding = response.headers.get("Content-Encoding", "")
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise FetchError("Response is too large")
            raw = _decode_body(raw, content_encoding)
    except urllib.error.HTTPError as error:
        raise FetchError(f"HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise FetchError(f"Request failed: {error.reason}") from error
    except TimeoutError as error:
        raise FetchError("Request timed out") from error
    return final_url, content_type, raw


def fetch_page(url: str) -> dict[str, Any]:
    key = url.strip()
    now = time.monotonic()
    with _CACHE_LOCK:
        cached = _CACHE.get(key)
        if cached and now - cached[0] < CACHE_TTL:
            return dict(cached[1])

    final_url, content_type, raw = _request(key)
    charset = "utf-8"
    match = re.search(r"charset=([\w-]+)", content_type, re.IGNORECASE)
    if match:
        charset = match.group(1)
    try:
        body = raw.decode(charset, errors="replace")
    except LookupError:
        body = raw.decode("utf-8", errors="replace")
    title, text = _extract_text(body, content_type)
    result = {
        "url": final_url,
        "title": title,
        "content_type": content_type.split(";")[0].strip(),
        "text": text,
    }
    with _CACHE_LOCK:
        _CACHE[key] = (now, result)
    return dict(result)


def fetch_html(url: str) -> str:
    """Return decoded HTML for a public page, used for profile username discovery."""
    _final_url, content_type, raw = _request(url)
    charset = "utf-8"
    match = re.search(r"charset=([\w-]+)", content_type, re.IGNORECASE)
    if match:
        charset = match.group(1)
    try:
        return raw.decode(charset, errors="replace")
    except LookupError:
        return raw.decode("utf-8", errors="replace")


def fetch_json(url: str, headers: dict[str, str] | None = None) -> Any:
    final_url, content_type, raw = _request(url, headers)
    if "json" not in content_type.lower():
        raise FetchError(f"Expected JSON, got {content_type or 'unknown content type'}")
    try:
        return json.loads(raw.decode("utf-8", errors="replace"))
    except ValueError as error:
        raise FetchError("Invalid JSON response") from error


def clean_html_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(_TAG_RE.sub("", value or ""))).strip()
