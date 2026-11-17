# Decision: Business Code Layout

Date: 2026-11-17
Status: Accepted

## Decision

- Move frontend source under `src/`: `src/app`, `src/components`, `src/lib`.
- Group `src/components/` by domain: admin, agent, blog, effects, hero, home, layout, providers, sections, terminal, ui.
- Group `src/lib/` by responsibility: content, i18n, site, stores; keep api/admin/utils at the root.
- Move Agent runtime to `backend/agent/`.
- Group deployment files under `deploy/`: Dockerfile, Compose, Caddyfile, start.sh.
- Keep `content/`, `messages/`, `data/`, and `public/` at the repo root.

## Why

Clear ownership and dependency direction without changing URLs, API paths, volumes, or Docker mounts.

## Impact

- TypeScript and Python imports were updated.
- Removed dead `typing-text`, `hero-parallax`, and `lib/emoji` files.
- Historical spec paths remain historical.
