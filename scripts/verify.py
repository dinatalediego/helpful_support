"""Run the complete local verification cycle."""

from __future__ import annotations

import subprocess
import sys

COMMANDS = [
    [sys.executable, "-m", "helpful_support.cli", "doctor"],
    [sys.executable, "-m", "helpful_support.cli", "index"],
    [sys.executable, "-m", "helpful_support.cli", "search", "webhooks idempotencia"],
    [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"],
]

if __name__ == "__main__":
    for command in COMMANDS:
        print("+", " ".join(command), flush=True)
        subprocess.run(command, check=True)
    print("Verification complete")
