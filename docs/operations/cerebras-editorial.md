# Legacy Cerebras adapter — disabled in scheduled operation

The September 17 live probe returned HTTP 402. The earlier description of this integration as permanently free was incorrect. Do not enable payment, enter a card or retry this provider automatically. The scheduled workflow now uses only `GROQ_API_KEY`; see `groq-editorial.md`. The Cerebras adapter exists only for backwards-compatible tests, not as a recommended free service.

If explicitly invoked, the legacy adapter uses a fixed endpoint and `qwen-3.8-27b`. It shares the two-article, six-request evidence-first safety limits. HTTP 401/402/403/429 stops further calls. There is no paid-provider fallback. Secrets must never enter frontend code, public snapshots, prompts or logs.

An article must have a verified full-body reader, matching source identity and body SHA-256. Feeds, headlines and short introductions alone are not sufficient. Unchanged verified bodies reuse cached editorials. Failed or rejected analysis is not published as a full explanation. English analysis may be retained when Chinese output is unavailable, with its language explicitly marked.

The second review is a safety filter, not independent proof that all economic interpretations are correct. Reported facts, general mechanisms and conditional scenarios remain separate. Do not automatically fabricate consensus expectations or market prices.

Current reader coverage is limited; registering a feed does not establish complete-body coverage. The THS adapter remains disabled until native scheduled retrieval is independently verified. This integration does not establish real stock quote coverage.

Verification before deployment: production build, snapshot contract validation, full Vitest suite, then inspect the actual Actions run and `cerebras-editorial` source health plus body-bound generated output. A successful mock test or Pages deployment alone does not prove real model generation.