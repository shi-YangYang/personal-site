# syntax=docker/dockerfile:1

# ---------- Node dependencies ----------
FROM node:22-bookworm-slim AS deps
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@12.10.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Next.js build ----------
FROM node:22-bookworm-slim AS builder
RUN npm config set registry https://registry.npmmirror.com/ \
  && npm install -g pnpm@12.10.1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_GISCUS_REPO=
ARG NEXT_PUBLIC_GISCUS_REPO_ID=
ARG NEXT_PUBLIC_GISCUS_CATEGORY=
ARG NEXT_PUBLIC_GISCUS_CATEGORY_ID=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GISCUS_REPO=$NEXT_PUBLIC_GISCUS_REPO
ENV NEXT_PUBLIC_GISCUS_REPO_ID=$NEXT_PUBLIC_GISCUS_REPO_ID
ENV NEXT_PUBLIC_GISCUS_CATEGORY=$NEXT_PUBLIC_GISCUS_CATEGORY
ENV NEXT_PUBLIC_GISCUS_CATEGORY_ID=$NEXT_PUBLIC_GISCUS_CATEGORY_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_BUILD_WORKERS=2
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV API_INTERNAL_URL=http://127.0.0.1:8000

RUN pnpm exec next build --webpack

# ---------- Python dependencies ----------
FROM python:3.12-slim AS pydeps
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN python -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# ---------- Runtime ----------
FROM python:3.12-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    API_INTERNAL_URL=http://127.0.0.1:8000 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app --create-home app

# Copy the Node 22 binary from the official image; both images are Debian 12.
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=pydeps /opt/venv /opt/venv

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY backend ./backend
COPY start.sh ./start.sh

RUN mkdir -p /app/data \
  && chmod +x /app/start.sh \
  && chown -R app:app /app

USER app
EXPOSE 3000

CMD ["/app/start.sh"]
