from __future__ import annotations

import os
import threading
import time
from collections import deque
from dataclasses import dataclass


def _env_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.environ.get(name, str(default))))
    except ValueError:
        return default


@dataclass
class LimitResult:
    allowed: bool
    retry_after: int = 0
    reason: str = ""


class AgentLimiter:
    """Small, process-local abuse guard for the public agent endpoint.

    This is deliberately not a distributed rate limiter. It protects a
    single-container deployment from casual scraping and accidental loops;
    put Cloudflare/WAF in front for serious public traffic.
    """

    def __init__(self) -> None:
        self.per_minute = _env_int("AGENT_RATE_PER_MIN", 6)
        self.per_day = _env_int("AGENT_RATE_PER_DAY", 40)
        self.global_per_day = _env_int("AGENT_GLOBAL_PER_DAY", 300)
        self.max_concurrent = _env_int("AGENT_MAX_CONCURRENT", 2)
        self.block_seconds = _env_int("AGENT_BLOCK_SECONDS", 300)
        self.block_after = _env_int("AGENT_BLOCK_AFTER", 6)
        self.max_question = _env_int("AGENT_MAX_QUESTION", 500)

        self._lock = threading.Lock()
        self._minute: dict[str, deque[float]] = {}
        self._day: dict[str, tuple[str, int]] = {}
        self._blocked: dict[str, float] = {}
        self._global: tuple[str, int] = ("", 0)
        self._active = 0

    @staticmethod
    def _today() -> str:
        return time.strftime("%Y-%m-%d", time.localtime())

    def begin(self, key: str) -> LimitResult:
        now = time.time()
        today = self._today()

        with self._lock:
            blocked_until = self._blocked.get(key, 0)
            if blocked_until > now:
                return LimitResult(False, max(1, int(blocked_until - now)), "blocked")

            bucket = self._minute.setdefault(key, deque())
            while bucket and now - bucket[0] >= 60:
                bucket.popleft()

            if len(bucket) >= self.per_minute:
                if len(bucket) >= self.block_after:
                    self._blocked[key] = now + self.block_seconds
                    return LimitResult(False, self.block_seconds, "blocked")
                return LimitResult(False, 60, "per_minute")

            day_key, day_count = self._day.get(key, (today, 0))
            if day_key != today:
                day_count = 0
            if day_count >= self.per_day:
                return LimitResult(False, 3600, "per_day")

            global_day, global_count = self._global
            if global_day != today:
                global_count = 0
            if global_count >= self.global_per_day:
                return LimitResult(False, 3600, "global_day")

            if self._active >= self.max_concurrent:
                return LimitResult(False, 2, "busy")

            bucket.append(now)
            self._day[key] = (today, day_count + 1)
            self._global = (today, global_count + 1)
            self._active += 1
            return LimitResult(True)

    def end(self) -> None:
        with self._lock:
            self._active = max(0, self._active - 1)
