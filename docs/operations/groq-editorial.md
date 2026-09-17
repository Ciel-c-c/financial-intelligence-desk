# Groq complete-body analysis

Configure repository Actions secret `GROQ_API_KEY`, keep the account on Free, and do not upgrade or enable paid fallback. The hourly data workflow uses only Groq for automatic analysis; Cerebras is not retried.

The fixed endpoint is `https://api.groq.com/openai/v1/chat/completions`, production model `openai/gpt-oss-120b`, reasoning effort low, JSON output. No browser search or execution tools are enabled. Secrets never enter public files or article prompts.

Each run attempts at most four current full articles. Facts need literal body evidence; interpretations are separated from reported facts. A separate model audit must approve before publication. This is a safety filter, not independent proof of truth. Invalid, truncated, rejected or quota-limited results remain unpublished; existing verified dated content is retained. Hash-bound editorial caching avoids repeated analysis of unchanged source bodies. Free account quotas are provider-controlled and may change.

Deployment alone is not proof of model operation. Inspect actual data-job source health (`groq-editorial`: attempted, generated itemCount, rejected, failures) and generated body-bound editorials. Reader/source coverage and stock quotations are separate work; this adapter does not make feed-only articles complete.
