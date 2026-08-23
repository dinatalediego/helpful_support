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

    @patch("urllib.request.urlopen")
    def test_update_run_uses_patch_user_jwt_and_returns_evidence(self, urlopen):
        urlopen.return_value = FakeResponse(
            [{"id": "run-1", "status": "succeeded", "latency_ms": 42}]
        )
        row = self.client.update_learning_run(
            "run-1",
            status="succeeded",
            response_status=200,
            latency_ms=42,
            succeeded=True,
            evidence={"result_count": 3},
            access_token="user-jwt",
        )
        request = urlopen.call_args.args[0]
        body = json.loads(request.data)

        self.assertEqual(request.method, "PATCH")
        self.assertIn("id=eq.run-1", request.full_url)
        self.assertEqual(request.get_header("Authorization"), "Bearer user-jwt")
        self.assertEqual(request.get_header("Prefer"), "return=representation")
        self.assertEqual(body["status"], "succeeded")
        self.assertEqual(body["evidence"]["result_count"], 3)
        self.assertEqual(row["latency_ms"], 42)

    @patch("urllib.request.urlopen")
    def test_feedback_is_inserted_as_private_user_data(self, urlopen):
        urlopen.return_value = FakeResponse([{"id": "feedback-1", "useful": True}])
        row = self.client.create_search_feedback(
            "webhook idempotencia",
            ["automation-events", "identity-security"],
            useful=True,
            comment="Los resultados permiten cerrar el ejercicio.",
            access_token="user-jwt",
        )
        request = urlopen.call_args.args[0]
        body = json.loads(request.data)

        self.assertEqual(request.method, "POST")
        self.assertTrue(request.full_url.endswith("/rest/v1/hs_search_feedback"))
        self.assertEqual(request.get_header("Authorization"), "Bearer user-jwt")
        self.assertEqual(body["result_slugs"][0], "automation-events")
        self.assertTrue(row["useful"])

    @patch("urllib.request.urlopen")
    def test_empty_rls_update_is_reported_without_claiming_not_found(self, urlopen):
        urlopen.return_value = FakeResponse([])
        with self.assertRaisesRegex(Exception, "RLS may deny access"):
            self.client.update_learning_run(
                "someone-elses-run",
                status="failed",
                response_status=403,
                latency_ms=1,
                succeeded=False,
                evidence={},
                access_token="user-jwt",
            )


if __name__ == "__main__":
    unittest.main()
