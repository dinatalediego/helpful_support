import sqlite3
import unittest

from examples.idempotent_webhook import process_once


class WebhookExampleTests(unittest.TestCase):
    def test_duplicate_event_is_not_processed_twice(self):
        calls = []
        con = sqlite3.connect(":memory:")
        self.assertTrue(process_once(con, "evt-1", {"lead": 42}, calls.append))
        self.assertFalse(process_once(con, "evt-1", {"lead": 42}, calls.append))
        self.assertEqual(calls, [{"lead": 42}])


if __name__ == "__main__":
    unittest.main()
