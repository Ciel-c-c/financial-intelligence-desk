# Complete-body automatic analysis

Repository Actions secret: `CEREBRAS_API_KEY`. Never put the value in frontend code, public snapshots, prompts or logs.

The hourly data job uses the fixed Cerebras chat-completions endpoint and `qwen-3.8-27b`. Each run attempts at most four complete articles within the last 24 hours. Each candidate needs both structured evidence validation and a separate model review. HTTP 401/402/403/429 stops further calls in that run. There is no paid-provider fallback. Keep the provider account on its free plan; application limits are not a provider billing guarantee.

An article must have a verified full-body reader, matching source identity and body SHA-256. Feeds, headlines and short introductions alone are not sufficient. Unchanged verified bodies reuse cached editorials. Failed or rejected analysis is not published as a full explanation. English analysis may be retained when Chinese output is unavailable, with its language explicitly marked.

The second review is a safety filter, not independent proof that all economic interpretations are correct. Reported facts, general mechanisms and conditional scenarios remain separate. Do not automatically fabricate consensus expectations or market prices.

Current reader coverage is limited; registering a feed does not establish complete-body coverage. The THS adapter remains disabled until native scheduled retrieval is independently verified. This integration does not establish real stock quote coverage.

Verification before deployment: production build, snapshot contract validation, full Vitest suite, then inspect the actual Actions run and `cerebras-editorial` source health plus body-bound generated output. A successful mock test or Pages deployment alone does not prove real model generation.
