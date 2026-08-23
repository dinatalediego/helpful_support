"""Dependency-free clients for Supabase Auth, Data API, RPC and Edge Functions."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Mapping


class SupabaseAPIError(RuntimeError):
    """Supabase returned a non-successful HTTP response."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(f"Supabase HTTP {status}: {message}")
        self.status = status


@dataclass(frozen=True)
class SupabaseConfig:
    url: str
    publishable_key: str
    access_token: str | None = None
    timeout: float = 15.0

    @classmethod
    def from_env(cls) -> "SupabaseConfig":
        url = os.getenv("SUPABASE_URL", "").rstrip("/")
        key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
        if not url or not key:
            raise ValueError(
                "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. "
                "Copy .env.example to .env, but never commit credentials."
            )
        return cls(
            url=url,
            publishable_key=key,
            access_token=os.getenv("SUPABASE_ACCESS_TOKEN") or None,
            timeout=float(os.getenv("HTTP_TIMEOUT_SECONDS", "15")),
        )


class SupabaseLabClient:
    def __init__(self, config: SupabaseConfig) -> None:
        self.config = config

    def _request(
        self,
        path: str,
        *,
        method: str = "GET",
        params: Mapping[str, Any] | None = None,
        body: Any | None = None,
        access_token: str | None = None,
        prefer: str | None = None,
    ) -> Any:
        query = urllib.parse.urlencode(params or {}, doseq=True, safe="(),*")
        url = f"{self.config.url}/{path.lstrip('/')}"
        if query:
            url = f"{url}?{query}"

        headers = {
            "Accept": "application/json",
            "apikey": self.config.publishable_key,
            "User-Agent": "helpful-support/0.3",
        }
        token = access_token or self.config.access_token
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if prefer:
            headers["Prefer"] = prefer

        data = None
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = urllib.request.Request(
            url,
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=self.config.timeout) as response:
                payload = response.read()
                if not payload:
                    return None
                return json.loads(payload.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise SupabaseAPIError(exc.code, detail[:500]) from exc

    def _require_user_token(self, access_token: str | None) -> str:
        token = access_token or self.config.access_token
        if not token:
            raise ValueError("SUPABASE_ACCESS_TOKEN is required for private user data.")
        return token

    @staticmethod
    def _first_row(rows: Any, action: str) -> dict[str, Any]:
        if not isinstance(rows, list) or not rows:
            raise SupabaseAPIError(
                404,
                f"{action} returned no row; it may not exist or RLS may deny access.",
            )
        return rows[0]

    def list_families(self) -> list[dict[str, Any]]:
        result = self._request(
            "rest/v1/hs_api_families",
            params={
                "select": "slug,name,summary,tags,maturity",
                "order": "name.asc",
            },
        )
        return result if isinstance(result, list) else []

    def search_library(self, query: str, limit: int = 8) -> list[dict[str, Any]]:
        result = self._request(
            "rest/v1/rpc/hs_search_library",
            method="POST",
            body={"search_query": query, "result_limit": limit},
        )
        return result if isinstance(result, list) else []

    def create_learning_run(
        self,
        objective: str,
        *,
        family_slug: str | None = None,
        method: str | None = None,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        token = self._require_user_token(access_token)
        rows = self._request(
            "rest/v1/hs_learning_runs",
            method="POST",
            body={
                "objective": objective,
                "family_slug": family_slug,
                "request_method": method,
                "status": "running",
            },
            access_token=token,
            prefer="return=representation",
        )
        return self._first_row(rows, "Insert")

    def update_learning_run(
        self,
        run_id: str,
        *,
        status: str,
        response_status: int | None,
        latency_ms: int,
        succeeded: bool,
        evidence: Mapping[str, Any],
        notes: str | None = None,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        """Close a user-owned run; the database remains the RLS authority."""
        token = self._require_user_token(access_token)
        rows = self._request(
            "rest/v1/hs_learning_runs",
            method="PATCH",
            params={
                "id": f"eq.{run_id}",
                "select": (
                    "id,status,response_status,latency_ms,succeeded,evidence,"
                    "notes,updated_at"
                ),
            },
            body={
                "status": status,
                "response_status": response_status,
                "latency_ms": latency_ms,
                "succeeded": succeeded,
                "evidence": dict(evidence),
                "notes": notes,
            },
            access_token=token,
            prefer="return=representation",
        )
        return self._first_row(rows, "Update")

    def create_search_feedback(
        self,
        query: str,
        result_slugs: list[str],
        *,
        useful: bool,
        comment: str | None = None,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        """Store user-owned retrieval feedback for later quality evaluation."""
        token = self._require_user_token(access_token)
        rows = self._request(
            "rest/v1/hs_search_feedback",
            method="POST",
            body={
                "query": query,
                "result_slugs": result_slugs,
                "useful": useful,
                "comment": comment,
            },
            access_token=token,
            prefer="return=representation",
        )
        return self._first_row(rows, "Feedback insert")

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        result = self._request(
            "auth/v1/token",
            method="POST",
            params={"grant_type": "password"},
            body={"email": email, "password": password},
        )
        if not isinstance(result, dict) or "access_token" not in result:
            raise SupabaseAPIError(500, "Auth returned no access token")
        return result

    def edge_search(
        self,
        query: str,
        *,
        limit: int = 8,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        token = self._require_user_token(access_token)
        result = self._request(
            "functions/v1/hs-api-lab",
            method="POST",
            body={"query": query, "limit": limit},
            access_token=token,
        )
        return result if isinstance(result, dict) else {}
