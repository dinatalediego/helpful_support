import unittest

from helpful_support.http_client import RetryPolicy


class RetryPolicyTests(unittest.TestCase):
    def test_delay_is_bounded(self):
        policy = RetryPolicy(base_seconds=0.1, max_seconds=1)
        for attempt in range(10):
            self.assertLessEqual(policy.delay(attempt), 1.2)
            self.assertGreater(policy.delay(attempt), 0)


if __name__ == "__main__":
    unittest.main()
