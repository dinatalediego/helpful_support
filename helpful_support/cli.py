"""Command-line interface for the local and Supabase-backed library."""

from __future__ import annotations

import argparse
import json
import platform
import sqlite3

from .library import DEFAULT_DB, ROOT, build_index, search
from .supabase_client import SupabaseAPIError, SupabaseConfig, SupabaseLabClient


def _catalog() -> dict:
    path = ROOT / "catalog" / "api_families.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _remote_client() -> SupabaseLabClient:
    return SupabaseLabClient(SupabaseConfig.from_env())


def _print_json(value: object) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(prog="helpful-support")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("doctor", help="check local requirements")
    sub.add_parser("index", help="rebuild the local search index")

    find = sub.add_parser("search", help="search the local knowledge library")
    find.add_argument("query")
    find.add_argument("--limit", type=int, default=8)

    family = sub.add_parser("api-family", help="show one local API family")
    family.add_argument("slug")

    sub.add_parser("remote-list", help="list API families from Supabase")

    remote_find = sub.add_parser("remote-search", help="search through Supabase RPC")
    remote_find.add_argument("query")
    remote_find.add_argument("--limit", type=int, default=8)

    sub.add_parser("remote-doctor", help="verify Supabase REST and RPC")

    remote_run = sub.add_parser("remote-run", help="create a private RLS learning run")
    remote_run.add_argument("objective")
    remote_run.add_argument("--family")
    remote_run.add_argument(
        "--method",
        choices=["GET", "POST", "PATCH", "PUT", "DELETE", "RPC", "EVENT"],
    )

    args = parser.parse_args()

    if args.command == "doctor":
        print(f"Python: {platform.python_version()}")
        print(f"SQLite: {sqlite3.sqlite_version}")
        try:
            con = sqlite3.connect(":memory:")
            try:
                con.execute("CREATE VIRTUAL TABLE check_fts USING fts5(value)")
            finally:
                con.close()
            print("FTS5: available")
            return 0
        except sqlite3.OperationalError:
            print("FTS5: unavailable")
            return 1

    if args.command == "index":
        count = build_index()
        print(f"Indexed {count} sections in {DEFAULT_DB}")
        return 0

    if args.command == "search":
        for index, result in enumerate(search(args.query, limit=args.limit), 1):
            print(f"\n{index}. {result['title']} — {result['section']}")
            print(f"   {result['source']}")
            print(f"   {result['excerpt']}")
        return 0

    if args.command == "api-family":
        item = next(
            (x for x in _catalog()["families"] if x["slug"] == args.slug),
            None,
        )
        if not item:
            print(
                "Unknown family. Available: "
                + ", ".join(x["slug"] for x in _catalog()["families"])
            )
            return 2
        _print_json(item)
        return 0

    try:
        client = _remote_client()
        if args.command == "remote-list":
            _print_json(client.list_families())
            return 0

        if args.command == "remote-search":
            _print_json(client.search_library(args.query, args.limit))
            return 0

        if args.command == "remote-doctor":
            families = client.list_families()
            hits = client.search_library("webhook idempotencia", 5)
            print(f"REST families: {len(families)}")
            print(f"RPC search hits: {len(hits)}")
            if len(families) < 12 or not hits:
                print("Remote verification failed")
                return 1
            print("Supabase API Lab: available")
            return 0

        if args.command == "remote-run":
            run = client.create_learning_run(
                args.objective,
                family_slug=args.family,
                method=args.method,
            )
            _print_json(run)
            return 0
    except (ValueError, SupabaseAPIError) as exc:
        print(f"Remote error: {exc}")
        return 1

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
