import httpx

from src.core.config import settings

TIMEOUT = 10.0


def send_email(to: str, subject: str, body: str) -> dict:
    """Send an email via the n8n webhook.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        body: Email body (plain text or HTML).

    Returns:
        The JSON response from the webhook.

    Raises:
        httpx.HTTPStatusError: If the webhook returns a non-2xx status.
    """
    auth = (settings.N8N_EMAIL_WEBHOOK_USER, settings.N8N_EMAIL_WEBHOOK_PASS) if settings.N8N_EMAIL_WEBHOOK_USER else None
    response = httpx.post(
        settings.N8N_EMAIL_WEBHOOK_URL,
        json={"to": to, "subject": subject, "body": body},
        auth=auth,
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json() if response.text else {"status": response.status_code}
