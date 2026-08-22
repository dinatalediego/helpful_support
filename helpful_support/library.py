"""Build and query a local SQLite FTS5 knowledge index."""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "library.db"


@dataclass(frozen=True)
class Document:
    source: str
    title: str
    section: str
    content: str
    tags: str = ""


def _sections(text: str) -> Iterable[tuple[str, str]]:
    heading = "Introduction"
    buffer: list[str] = []
    for line in text.splitlines():
        if line.startswith("#"):
            if buffer:
                yield heading, "\n".join(buffer).strip()
            heading = line.lstrip("#").strip()
            buffer = []
        else:
            buffer.append(line)
    if buffer:
        yield heading, "\n".join(buffer).strip()


def load_documents(root: Path = ROOT) -> list[Document]:
    docs: list[Document] = []
    for path in sorted((root / "docs").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        title = next((line.lstrip("#").strip() for line in text.splitlines() if line.startswith("#")), path.stem)
        for section, content in _sections(text):
            if content:
                docs.append(Document(str(path.relative_to(root)), title, section, content))
    catalog = root / "catalog" / "api_families.json"
    if catalog.exists():
        for item in json.loads(catalog.read_text(encoding="utf-8"))["families"]:
            docs.append(Document(
                str(catalog.relative_to(root)),
                item["name"],
                "API family",
                " ".join(item["problems"] + item["examples"] + item["risks"] + item["project_uses"]),
                " ".join(item["tags"]),
            ))
    return docs


def build_index(db_path: Path = DEFAULT_DB, root: Path = ROOT) -> int:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    docs = load_documents(root)
    with sqlite3.connect(db_path) as con:
        con.execute("DROP TABLE IF EXISTS library")
        con.execute(
            "CREATE VIRTUAL TABLE library USING fts5(source, title, section, content, tags, tokenize='unicode61')"
        )
        con.executemany(
            "INSERT INTO library VALUES (?, ?, ?, ?, ?)",
            [(d.source, d.title, d.section, d.content, d.tags) for d in docs],
        )
    return len(docs)


def search(query: str, *, limit: int = 8, db_path: Path = DEFAULT_DB) -> list[dict[str, str]]:
    if not db_path.exists():
        build_index(db_path)
    tokens = re.findall(r"[\wáéíóúñ]+", query.lower(), flags=re.UNICODE)
    if not tokens:
        return []
    safe_query = " OR ".join(f'"{token}"' for token in tokens)
    sql = """
        SELECT source, title, section,
               snippet(library, 3, '[', ']', ' … ', 24) AS excerpt,
               bm25(library) AS rank
        FROM library WHERE library MATCH ? ORDER BY rank LIMIT ?
    """
    with sqlite3.connect(db_path) as con:
        rows = con.execute(sql, (safe_query, limit)).fetchall()
    return [
        {"source": row[0], "title": row[1], "section": row[2], "excerpt": row[3]}
        for row in rows
    ]
