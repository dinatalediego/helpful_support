"""Convenience entry point for rebuilding the knowledge index."""

from helpful_support.library import build_index

if __name__ == "__main__":
    print(f"Indexed {build_index()} sections")
