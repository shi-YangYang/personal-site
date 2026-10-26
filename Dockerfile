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
ARG NEXT_PUBLIC_API_BASE_URL=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GISCUS_REPO=$NEXT_PUBLIC_GISCUS_REPO
ENV NEXT_PUBLIC_GISCUS_REPO_ID=$NEXT_PUBLIC_GISCUS_REPO_ID
ENV NEXT_PUBLIC_GISCUS_CATEGORY=$NEXT_PUBLIC_GISCUS_CATEGORY
ENV NEXT_PUBLIC_GISCUS_CATEGORY_ID=$NEXT_PUBLIC_GISCUS_CATEGORY_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_BUILD_WORKERS=2
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN pnpm exec next build --webpack

# ---------- Python dependencies ----------
FROM python:3.12-slim-bookworm AS pydeps
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn \
    PIP_DEFAULT_TIMEOUT=60
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN python -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# ---------- Runtime ----------
FROM python:3.12-slim-bookworm AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    HOME=/app \
    XDG_CONFIG_HOME=/app/.config \
    PATH="/opt/venv/bin:$PATH"

# Copy the Node 22 binary and static Caddy binary from official images.
# ca-certificates comes from the Node image, avoiding a runtime apt-get.
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/bin/caddy
COPY --from=pydeps /opt/venv /opt/venv

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY backend ./backend
COPY Caddyfile ./Caddyfile
COPY start.sh ./start.sh

RUN echo "app:x:1001:1001::/app:/sbin/nologin" >> /etc/passwd \
  && echo "app:x:1001:" >> /etc/group \
  && mkdir -p /app/data /app/.config \
  && chmod +x /app/start.sh \
  && chown -R 1001:1001 /app

USER app
EXPOSE 3000

CMD ["/app/start.sh"]
