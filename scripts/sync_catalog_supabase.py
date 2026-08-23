"""Server-only sync of catalog/api_families.json to Supabase.

Requires SUPABASE_SECRET_KEY. Never use or import this script in frontend code.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    secret = os.getenv("SUPABASE_SECRET_KEY", "")
    if not url or not secret:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in the server environment.")

    catalog = json.loads(
        (ROOT / "catalog" / "api_families.json").read_text(encoding="utf-8")
    )
    rows = []
    for item in catalog["families"]:
        all_text = (
            [item["name"]]
            + item["problems"]
            + item["examples"]
            + item["risks"]
            + item["project_uses"]
            + item["tags"]
        )
        rows.append(
            {
                **item,
                "summary": "; ".join(item["problems"]),
                "search_text": " ".join(all_text),
                "maturity": 1,
                "status": "published",
            }
        )

    request = urllib.request.Request(
        f"{url}/rest/v1/hs_api_families?on_conflict=slug",
        data=json.dumps(rows, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": secret,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
            "User-Agent": "helpful-support-catalog-sync/0.2",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status not in {200, 201, 204}:
                raise RuntimeError(f"Unexpected status: {response.status}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Sync failed with HTTP {exc.code}: {detail[:500]}") from exc

    print(f"Synced {len(rows)} API families")


if __name__ == "__main__":
    main()
