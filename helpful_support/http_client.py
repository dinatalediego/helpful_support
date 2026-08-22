"""Small, dependency-free JSON HTTP client with safe defaults."""

from __future__ import annotations

import json
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Mapping


class APIError(RuntimeError):
    """Remote API returned a terminal error."""


@dataclass(frozen=True)
class RetryPolicy:
    attempts: int = 3
    base_seconds: float = 0.4
    max_seconds: float = 4.0

    def delay(self, attempt: int) -> float:
        exponential = min(self.max_seconds, self.base_seconds * (2**attempt))
        return exponential * (0.8 + random.random() * 0.4)


class JSONClient:
    def __init__(
        self,
        base_url: str,
        *,
        timeout: float = 15,
        headers: Mapping[str, str] | None = None,
        retry: RetryPolicy | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.headers = {"Accept": "application/json", "User-Agent": "helpful-support/0.1"}
        self.headers.update(headers or {})
        self.retry = retry or RetryPolicy()

    def get(self, path: str = "", *, params: Mapping[str, Any] | None = None) -> Any:
        query = urllib.parse.urlencode(params or {}, doseq=True)
        url = f"{self.base_url}/{path.lstrip('/')}"
        if query:
            url = f"{url}?{query}"
        request = urllib.request.Request(url, headers=self.headers, method="GET")
        return self._send(request)

    def _send(self, request: urllib.request.Request) -> Any:
        last_error: Exception | None = None
        for attempt in range(self.retry.attempts):
            try:
                with urllib.request.urlopen(request, timeout=self.timeout) as response:
                    charset = response.headers.get_content_charset() or "utf-8"
                    return json.loads(response.read().decode(charset))
            except urllib.error.HTTPError as exc:
                if exc.code not in {429, 500, 502, 503, 504}:
                    raise APIError(f"HTTP {exc.code} for {request.full_url}") from exc
                last_error = exc
            except (urllib.error.URLError, TimeoutError) as exc:
                last_error = exc
            if attempt + 1 < self.retry.attempts:
                time.sleep(self.retry.delay(attempt))
        raise APIError(f"Request failed after {self.retry.attempts} attempts") from last_error
