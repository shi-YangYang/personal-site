<p align="center">
  <img src="./public/favicon.svg" width="72" height="72" alt="Personal Site 图标" />
</p>

<h1 align="center">Personal Site</h1>

<p align="center">
  <a href="./README.md">English</a> · 简体中文
</p>

<p align="center">
  双语个人站、博客与站内 Agent。<br />
  一个仓库，一个容器。
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://heroui.com"><img src="https://img.shields.io/badge/HeroUI-3-10b981?style=flat-square" alt="HeroUI 3" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=flat-square" alt="MIT License" /></a>
</p>

## 概览

Personal Site 是一个自托管的个人作品集与博客，面向希望掌控完整技术栈的开发者。它包含暗色编辑风格前端、Python API、文件型内容，以及一个基于站内资料回答问题的 Agent。

项目不使用数据库，也不依赖外部 CMS。个人资料、项目、文章和运行时配置以 JSON / MDX 保存，通过一个 Docker 容器部署。

## 功能

- **默认双语** — 中文和英文共用一套内容模型。页面是真实路由，例如 `/zh/projects` 和 `/en/about`，不是 hash 链接。
- **基于站内资料的 LangGraph Agent** — 只读工具图从个人资料、项目、经历和文章中检索答案并附带引用。通过 `AGENT` 按钮或 `⌘J` 打开；没有模型 Key 时使用本地检索，配置 OpenAI 兼容模型后启用工具调用。公开接口按 IP 和全站限流，API Key 只保存在服务端。可在 `/admin` → 模型配置中保存和测试模型。
- **读取真实数据的终端** — 按 `~` 或 `⌘K` 打开终端，用于导航、查看阅读量、切换主题和语言。终端读取与站点相同的内容。
- **使用 MDX 写作** — 文章支持 frontmatter、标签、阅读时间、代码高亮和可选的 giscus 评论。`/admin` 可管理个人资料、模型和邮件设置；文章仍以文件维护。
- **无需数据库** — `content/` 和 `data/` 是内容与运行时数据的来源，备份就是普通文件。
- **单容器、单端口** — Caddy 提供公开入口，将 `/api/*` 转发给 FastAPI，其余请求交给 Next.js。

## 架构

容器在一个公开端口后运行三个进程：

- **Caddy** 监听 `3000`，将 `/api/*` 转发给 FastAPI，其余请求转发给 Next.js。
- **FastAPI** 处理 Agent、联系表单、阅读量和管理 API。
- **Next.js** 在内部端口 `3001` 渲染页面和静态资源。

`site-data` 和 `site-content` 是两个 Docker 命名卷。`site-data` 保存个人资料、邮件配置、阅读量和模型配置；`site-content` 保存文章。两者都会在容器重建后保留。

## 快速开始

### Docker

```bash
git clone https://github.com/shi-YangYang/personal-site.git
cd personal-site

cp .env.example .env
# 生产环境请先设置 ADMIN_PASSWORD 和 ADMIN_SESSION_SALT。

docker compose --project-directory . -f deploy/docker-compose.yml up -d --build
```

打开 [http://localhost:3000/zh](http://localhost:3000/zh)。在通过 `/admin` 或 `data/personal.local.json` 填写个人资料前，站点显示占位内容。

### 本地开发

需要 Node.js 20.9+、Python 3.9+ 和 pnpm。

```bash
pnpm install

python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt

pnpm dev
```

`pnpm dev` 会同时启动 FastAPI 和 Next.js，自动选择可用的 API 端口，并注入 `NEXT_PUBLIC_API_BASE_URL`。打开 [http://localhost:3000/zh](http://localhost:3000/zh)。

## 配置

从 [`.env.example`](./.env.example) 开始。主要变量：

| 变量 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD` | 启用 `/admin`。不设置时管理后台保持禁用。 |
| `ADMIN_SESSION_SALT` | 共享会话盐，Next.js 与 FastAPI 必须一致。 |
| `COOKIE_SECURE` | 使用 HTTPS 时设为 `true`。 |
| `NEXT_PUBLIC_SITE_URL` | 用于 metadata 和 sitemap 的规范 URL。 |
| `AGENT_LLM_BASE_URL`、`AGENT_LLM_API_KEY`、`AGENT_MODEL` | OpenAI 兼容模型的可选默认值。也可以在 `/admin` → 模型配置中运行时保存。没有模型时使用本地检索。 |
| `SMTP_*` | 可选的 Contact 邮件通知。 |
| `AGENT_RATE_PER_MIN`、`AGENT_RATE_PER_DAY`、`AGENT_GLOBAL_PER_DAY` | Agent 防滥用限额。默认值较保守，详见 `.env.example`。 |

## 隐私

仓库只包含占位内容。真实个人资料、邮件凭证、阅读量和本地草稿不会进入 Git：

```text
data/personal.local.json
data/mail.json
data/views.json
content/blog/**/_local/
content/blog/**/_drafts/
```

只有 `content/data/` 下的占位文件和示例文章会被提交。站点可以安全 fork 和修改，不会发布个人信息。

## 项目结构

```text
src/app/[lang]/          双语页面与分区路由
src/app/admin/           Cookie 保护的管理后台
backend/             FastAPI：Agent、联系表单、阅读量、管理 API
src/components/      按领域组织：admin、agent、blog、effects、hero、home、layout、providers、sections、terminal、ui
content/             占位个人资料与 MDX 文章
data/                运行时数据（gitignored）
src/lib/             API/admin/utils 与 content、i18n、site、stores
deploy/Caddyfile     公开入口
deploy/Dockerfile    Caddy + Next.js + FastAPI 镜像
deploy/docker-compose.yml  volume、healthcheck、运行时配置
```

Agent 的实现见 [Spec](specs/spec-002-cyber-agent/spec.md) 和 [验收记录](specs/spec-002-cyber-agent/acceptance.md)。

## 部署

Docker Compose 是支持的部署方式：

```bash
docker compose --project-directory . -f deploy/docker-compose.yml up -d --build
```

只暴露 `3000` 端口。保留 `site-data` 和 `site-content` 两个 volume；不要执行 `docker compose down -v`。

部署通过 **Actions → Deploy → Run workflow** 手动触发。工作流会在重建前备份两个 volume。PR 会运行 CI，包括前端 lint/build、后端 import/compile 和 Docker 镜像构建。

## 贡献

Pull request 目标分支为 `dev`。请保持改动聚焦，较大改动先开 issue 讨论。CI 会对目标为 `dev` 或 `main` 的 PR 运行。

## 许可证

[MIT](./LICENSE) © 2026 · 维护者 [@shi-YangYang](https://github.com/shi-YangYang)
