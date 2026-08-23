"""Interactive Auth -> RLS -> RPC -> Edge Function learning flow.

Credentials are read interactively and tokens are kept only in memory.
"""

from __future__ import annotations

import getpass

from helpful_support.supabase_client import SupabaseConfig, SupabaseLabClient


def main() -> None:
    client = SupabaseLabClient(SupabaseConfig.from_env())
    email = input("Supabase email: ").strip()
    password = getpass.getpass("Supabase password: ")
    session = client.sign_in(email, password)
    access_token = session["access_token"]

    run = client.create_learning_run(
        "Completar Auth → RLS → RPC → Edge Function",
        family_slug="identity-security",
        method="POST",
        access_token=access_token,
    )
    print("Private run created:", run["id"])

    result = client.edge_search(
        "webhook idempotencia",
        limit=5,
        access_token=access_token,
    )
    print("Edge search results:", result.get("count"))


if __name__ == "__main__":
    main()
