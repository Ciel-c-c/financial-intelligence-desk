# Groq complete-body analysis

Configure repository Actions secret `GROQ_API_KEY`, keep the account on Free, and do not upgrade or enable paid fallback. The hourly data workflow uses only Groq for automatic analysis; Cerebras is not retried.

The fixed endpoint is `https://api.groq.com/openai/v1/chat/completions`, production model `openai/gpt-oss-120b`, reasoning effort low, JSON output. No browser search or execution tools are enabled. Secrets never enter public files or article prompts.

Each run attempts at most two current full articles and six requests, with at least 60 seconds between Groq requests. First extract reported facts, background, explicitly reported expectations and uncertainties with short literal evidence quotations. Code validates quotations and numbers before mechanism analysis. Mechanism generation cannot overwrite extracted facts. Finally code validation and a separate model audit must approve before atomic publication. This is a safety filter, not independent proof of truth. Invalid, truncated, rejected or quota-limited results remain unpublished; existing verified dated content is retained. Hash-bound editorial caching avoids repeated analysis of unchanged source bodies. Free account quotas are provider-controlled and may change.

Public `editorial.evidence` contains short evidence quotations, not the full body. `analysisAttempt` tracks hash-bound retry counts, capped at three for an unchanged body; less-attempted candidates receive priority so failures cannot permanently block other articles. Source health exposes passed `stages.evidence`, `stages.analysis`, `stages.audit`, rejection categories and published `itemCount`. All rejected attempts report error even when the API is reachable. API connectivity and successful editorial publication are different results.

Deployment alone is not proof of model operation. Inspect actual data-job source health (`groq-editorial`: attempted, generated itemCount, rejected, failures) and generated body-bound editorials. Reader/source coverage and stock quotations are separate work; this adapter does not make feed-only articles complete.
