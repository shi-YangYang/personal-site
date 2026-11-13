# Decision: LangGraph Agent + Runtime Model Config

## Context

The site agent started as keyword retrieval with an optional single-shot LLM call. The goal is a real tool-using agent that can answer from profile, project, experience, skill, and post data while keeping the public endpoint cheap and abuse-resistant.

## Decision

- Use LangGraph (Python) in the existing FastAPI backend.
- Expose read-only tools only: site search, profile, experience, skills, project, post.
- Keep a deterministic local retrieval fallback when no model is configured.
- Store model base URL, model name, and API key in `data/agent.json` (Docker `site-data` volume), with environment variables as defaults.
- Add an admin-only model panel for saving, testing, and fetching model IDs.
- Rate-limit the public agent endpoint per IP and globally, and cap concurrency, input length, tool iterations, LLM output tokens, and timeout.
- Keep the API key server-side; admin APIs never return it.

## Reason

LangGraph gives explicit control over the tool loop, fallback, and state without introducing Deep Agents' planning/subagent overhead for a bounded site Q&A agent. Runtime configuration lets the owner switch providers without rebuilding the container.

## Alternatives

- Deep Agents: rejected for this use case; too much autonomy, latency, and cost for a read-only site assistant.
- Node.js LangGraph: rejected because the backend is already FastAPI/Python and the content/tool layer is Python.
- Environment-only model config: rejected because changing a model would require a container restart.

## Consequences

- New Python dependencies: `langgraph`, `langchain-openai`, `langchain-core`.
- Rate limiting is process-local; distributed abuse still needs a WAF/CDN.
- The model config file contains a secret and must remain on the private data volume, never in Git.
- LLM tool calling is optional; without a key the agent still works through local retrieval.
