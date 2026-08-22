# Security policy

Do not open public issues containing credentials, personal data, production URLs with tokens or customer records.

## Reporting

Report a suspected vulnerability privately to the repository owner through GitHub. Include impact, reproduction steps and a minimal redacted example.

## Baseline rules

- Never commit `.env`, tokens or database dumps.
- Use least-privilege credentials per environment.
- Validate webhook signatures before processing.
- Parameterize SQL and validate untrusted URLs.
- Redact PII from logs and test fixtures.
- Rotate any secret immediately if it appears in Git history.
