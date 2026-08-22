"""Example: deduplicate webhook events with SQLite."""

import json
import sqlite3
from typing import Callable


def process_once(
    con: sqlite3.Connection,
    event_id: str,
    payload: dict,
    handler: Callable[[dict], None],
) -> bool:
    con.execute(
        "CREATE TABLE IF NOT EXISTS processed_events "
        "(event_id TEXT PRIMARY KEY, payload TEXT NOT NULL, processed_at TEXT DEFAULT CURRENT_TIMESTAMP)"
    )
    try:
        con.execute(
            "INSERT INTO processed_events(event_id, payload) VALUES (?, ?)",
            (event_id, json.dumps(payload, ensure_ascii=False)),
        )
    except sqlite3.IntegrityError:
        return False
    try:
        handler(payload)
        con.commit()
        return True
    except Exception:
        con.rollback()
        raise


if __name__ == "__main__":
    db = sqlite3.connect(":memory:")
    print(process_once(db, "evt-1", {"lead_id": 42}, print))
    print(process_once(db, "evt-1", {"lead_id": 42}, print))
