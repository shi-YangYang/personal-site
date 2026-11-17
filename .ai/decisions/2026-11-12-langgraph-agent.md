# Decision: LangGraph Agent

Date: 2026-11-12
Status: Accepted

## Decision

- Use LangGraph in the FastAPI backend.
- Expose read-only site tools: search, profile, experience, skills, project, post.
- Fall back to local retrieval when no model is configured.
- Store model config in `data/agent.json`; edit it in `/admin`.
- Rate-limit per IP and globally; cap concurrency, tool rounds, output tokens, and timeout.
- Keep the API key server-side.

## Why

Explicit tool control without Deep Agents' autonomy overhead; model changes do not require a rebuild.

## Impact

- Adds `langgraph`, `langchain-openai`, and `langchain-core`.
- Local retrieval remains available without a key.
- Process-local limits still need a WAF for distributed abuse.
