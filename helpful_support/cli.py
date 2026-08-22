"""Command-line interface for the library."""

from __future__ import annotations

import argparse
import json
import platform
import sqlite3
import sys
from pathlib import Path

from .library import DEFAULT_DB, ROOT, build_index, search


def _catalog() -> dict:
    path = ROOT / "catalog" / "api_families.json"
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(prog="helpful-support")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("doctor", help="check local requirements")
    sub.add_parser("index", help="rebuild the local search index")
    find = sub.add_parser("search", help="search the knowledge library")
    find.add_argument("query")
    find.add_argument("--limit", type=int, default=8)
    family = sub.add_parser("api-family", help="show one API family")
    family.add_argument("slug")
    args = parser.parse_args()

    if args.command == "doctor":
        print(f"Python: {platform.python_version()}")
        print(f"SQLite: {sqlite3.sqlite_version}")
        try:
            with sqlite3.connect(":memory:") as con:
                con.execute("CREATE VIRTUAL TABLE check_fts USING fts5(value)")
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

    item = next((x for x in _catalog()["families"] if x["slug"] == args.slug), None)
    if not item:
        print("Unknown family. Available: " + ", ".join(x["slug"] for x in _catalog()["families"]))
        return 2
    print(json.dumps(item, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
