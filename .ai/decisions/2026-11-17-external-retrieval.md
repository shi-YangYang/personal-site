# Decision: External Retrieval

Date: 2026-11-17
Status: Accepted

## Decision

- Add `search_github` via the official GitHub Search API.
- Add `search_csdn` via CSDN's search JSON endpoint with stable browser headers.
- Add `get_my_github` and `get_my_csdn`, which resolve the owner's profile links and return their own public repositories/articles.
- Add `web_fetch` for one public http(s) URL, with readable-text extraction.
- Cache results for 5 minutes, cap results, enforce timeouts and response size.
- Block localhost, private/reserved addresses, non-http(s) schemes, and non-standard ports.
- Treat external text as untrusted; cite title and URL.
- Keep `GITHUB_TOKEN` server-side; code search requires it.
- Allow disabling CSDN search and web fetch through environment variables.

## Why

No third-party search API is required, while GitHub has an official API and CSDN search is reachable through its public web endpoint.

## Impact

- External tools are only available in LLM mode.
- CSDN uses an undocumented endpoint and may break without notice.
- Public agent limits still apply; external calls add latency and network dependency.
