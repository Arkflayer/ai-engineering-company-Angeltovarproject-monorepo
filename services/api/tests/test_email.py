import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.email import send_reset_email


class ResetEmailTests(unittest.TestCase):
    @patch("app.email.urlopen")
    @patch("app.email.get_settings", return_value=SimpleNamespace(
        resend_api_key="test-key-not-real", resend_from_email="TrackFlow <no-reply@example.com>"
    ))
    def test_sends_resend_request_using_standard_library(self, _settings, urlopen):
        response = urlopen.return_value.__enter__.return_value
        response.read.return_value = b'{"id":"email_test_123"}'

        send_reset_email("person@example.com", "https://trackflow.example/reset-password?token=fake-token")

        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.resend.com/emails")
        self.assertEqual(request.method, "POST")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-key-not-real")
        self.assertEqual(dict(request.headers).get("User-agent"), "TrackFlow-API/1.0")
        payload = json.loads(request.data)
        self.assertEqual(payload["from"], "TrackFlow <no-reply@example.com>")
        self.assertEqual(payload["to"], ["person@example.com"])
        self.assertIn("fake-token", payload["html"])
        urlopen.assert_called_once_with(request, timeout=15)

    @patch("app.email.get_settings", return_value=SimpleNamespace(resend_api_key=""))
    def test_missing_api_key_fails_instead_of_claiming_email_was_sent(self, _settings):
        with self.assertRaisesRegex(RuntimeError, "RESEND_API_KEY"):
            send_reset_email("person@example.com", "https://example.invalid/reset")

    @patch("app.email.urlopen")
    @patch("app.email.get_settings", return_value=SimpleNamespace(
        resend_api_key="test-key-not-real", resend_from_email="onboarding@resend.dev"
    ))
    def test_provider_failure_does_not_return_success(self, _settings, urlopen):
        from urllib.error import HTTPError

        urlopen.side_effect = HTTPError("https://api.resend.com/emails", 403, "forbidden", {}, None)
        with self.assertRaisesRegex(RuntimeError, "HTTP 403"):
            send_reset_email("person@example.com", "https://example.invalid/reset")


if __name__ == "__main__":
    unittest.main()
