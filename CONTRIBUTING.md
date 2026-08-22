# Contributing

A library entry should answer:

1. What decision or problem does it support?
2. When should it not be used?
3. What is its input/output/error contract?
4. What executable example proves the claim?
5. What security, cost and operational risks exist?
6. How is success measured?

Before proposing a change run:

```bash
python scripts/verify.py
```

Never include customer data or secrets. Prefer small examples with public endpoints and deterministic tests.
