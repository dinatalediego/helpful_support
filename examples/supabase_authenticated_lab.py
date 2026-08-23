"""Interactive Auth -> RLS -> RPC -> Edge -> evidence/feedback flow.

Credentials are read interactively and tokens are kept only in memory.
Pass --run-id to close an existing user-owned run instead of creating one.
"""

from __future__ import annotations

import argparse
import getpass
import time
from typing import Any

from helpful_support.supabase_client import (
    SupabaseAPIError,
    SupabaseConfig,
    SupabaseLabClient,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Complete a Supabase API learning run with measurable evidence."
    )
    parser.add_argument(
        "--run-id",
        help="Existing hs_learning_runs UUID. Omit it to create a new run.",
    )
    parser.add_argument("--query", default="webhook idempotencia")
    parser.add_argument("--limit", type=int, default=5)
    return parser.parse_args()


def result_slugs(result: dict[str, Any]) -> list[str]:
    rows = result.get("results")
    if not isinstance(rows, list):
        return []
    return [
        str(row["slug"])
        for row in rows
        if isinstance(row, dict) and row.get("slug")
    ]


def ask_usefulness() -> bool:
    while True:
        answer = input("¿Los resultados fueron útiles? [s/n]: ").strip().lower()
        if answer in {"s", "si", "sí", "y", "yes"}:
            return True
        if answer in {"n", "no"}:
            return False
        print("Responde s o n para conservar una etiqueta de evaluación válida.")


def main() -> None:
    args = parse_args()
    client = SupabaseLabClient(SupabaseConfig.from_env())
    email = input("Supabase email: ").strip()
    password = getpass.getpass("Supabase password: ")
    session = client.sign_in(email, password)
    password = ""
    access_token = session["access_token"]

    if args.run_id:
        run_id = args.run_id
        print("Private run selected:", run_id)
    else:
        run = client.create_learning_run(
            "Completar Auth → RLS → RPC → Edge → evidencia",
            family_slug="identity-security",
            method="POST",
            access_token=access_token,
        )
        run_id = run["id"]
        print("Private run created:", run_id)

    started = time.perf_counter()
    try:
        result = client.edge_search(
            args.query,
            limit=args.limit,
            access_token=access_token,
        )
    except SupabaseAPIError as exc:
        latency_ms = round((time.perf_counter() - started) * 1000)
        client.update_learning_run(
            run_id,
            status="failed",
            response_status=exc.status,
            latency_ms=latency_ms,
            succeeded=False,
            evidence={
                "flow": "auth-rls-rpc-edge",
                "query": args.query,
                "error_type": type(exc).__name__,
            },
            notes="Edge Function returned a non-successful HTTP response.",
            access_token=access_token,
        )
        print(f"Run closed as failed ({exc.status}, {latency_ms} ms).")
        raise

    latency_ms = round((time.perf_counter() - started) * 1000)
    slugs = result_slugs(result)
    count = result.get("count")
    if not isinstance(count, int):
        count = len(slugs)

    completed = client.update_learning_run(
        run_id,
        status="succeeded",
        response_status=200,
        latency_ms=latency_ms,
        succeeded=True,
        evidence={
            "flow": "auth-rls-rpc-edge",
            "query": args.query,
            "result_count": count,
            "result_slugs": slugs,
            "edge_meta": result.get("meta", {}),
        },
        notes="Cerrado por el usuario autenticado; RLS protegió la escritura.",
        access_token=access_token,
    )
    useful = ask_usefulness()
    comment = input("Comentario de evaluación (opcional): ").strip() or None
    feedback = client.create_search_feedback(
        args.query,
        slugs,
        useful=useful,
        comment=comment,
        access_token=access_token,
    )

    print(f"Edge search results: {count} ({latency_ms} ms)")
    print("Run status:", completed["status"])
    print("Feedback created:", feedback["id"])
    print("Ciclo cerrado: Auth → RLS → RPC → Edge → métrica → feedback")


if __name__ == "__main__":
    main()
