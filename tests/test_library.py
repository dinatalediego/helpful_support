import json
import tempfile
import unittest
from pathlib import Path

from helpful_support.library import build_index, load_documents, search


class LibraryTests(unittest.TestCase):
    def test_sources_are_loadable(self):
        docs = load_documents()
        self.assertGreater(len(docs), 10)
        self.assertTrue(any(d.source.endswith("api_families.json") for d in docs))

    def test_index_search_and_release_file(self):
        with tempfile.TemporaryDirectory() as directory:
            db = Path(directory) / "test.db"
            count = build_index(db)
            self.assertGreater(count, 10)
            results = search("webhook idempotencia", db_path=db)
            self.assertTrue(results)

            # Regression: Windows raises WinError 32 if SQLite left a handle open.
            db.unlink()
            self.assertFalse(db.exists())

    def test_catalog_has_required_contract(self):
        path = Path(__file__).parents[1] / "catalog" / "api_families.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        required = {
            "slug",
            "name",
            "problems",
            "examples",
            "risks",
            "project_uses",
            "tags",
        }
        self.assertGreaterEqual(len(data["families"]), 10)
        for family in data["families"]:
            self.assertTrue(required.issubset(family))


if __name__ == "__main__":
    unittest.main()
