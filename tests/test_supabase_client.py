import json
import unittest
from unittest.mock import patch

from helpful_support.supabase_client import SupabaseConfig, SupabaseLabClient


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload = json.dumps(payload).encode()
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.payload


class SupabaseClientTests(unittest.TestCase):
    def setUp(self):
        self.client = SupabaseLabClient(
            SupabaseConfig(
                url="https://example.supabase.co",
                publishable_key="sb_publishable_test",
            )
        )

    @patch("urllib.request.urlopen")
    def test_lists_families_with_publishable_key(self, urlopen):
        urlopen.return_value = FakeResponse([{"slug": "crm-marketing"}])
        rows = self.client.list_families()
        request = urlopen.call_args.args[0]

        self.assertEqual(rows[0]["slug"], "crm-marketing")
        self.assertEqual(request.method, "GET")
        self.assertEqual(request.get_header("Apikey"), "sb_publishable_test")
        self.assertNotIn("Authorization", request.headers)

    @patch("urllib.request.urlopen")
    def test_rpc_uses_post_json(self, urlopen):
        urlopen.return_value = FakeResponse([{"slug": "automation-events"}])
        rows = self.client.search_library("webhook", limit=3)
        request = urlopen.call_args.args[0]
        body = json.loads(request.data)

        self.assertEqual(request.method, "POST")
        self.assertEqual(body["search_query"], "webhook")
        self.assertEqual(body["result_limit"], 3)
        self.assertEqual(rows[0]["slug"], "automation-events")

    def test_private_run_requires_user_token(self):
        with self.assertRaisesRegex(ValueError, "ACCESS_TOKEN"):
            self.client.create_learning_run("Test RLS")


if __name__ == "__main__":
    unittest.main()
