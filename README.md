# Personal Site

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

一个现代、快速、**中英双语**的个人作品集 + 博客模板，基于 **Next.js 16 + React 19 + Tailwind CSS 4**。暗色赛博绿风格：毛玻璃、3D 特效、访客终端、MDX 博客、后台管理、Docker 一键自部署。

## 目录

- [安全](#安全)
- [背景](#背景)
- [安装](#安装)
- [使用](#使用)
  - [快速开始](#快速开始)
  - [后台管理](#后台管理)
  - [自定义](#自定义)
- [部署](#部署)
  - [Docker 自托管](#docker-自托管)
  - [Vercel / Netlify](#vercel--netlify)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [维护者](#维护者)
- [贡献](#贡献)
- [许可证](#许可证)

## 安全

项目设计为「**可以安全地开源**」——你的真实个人信息永远只存在于本地，不会提交到仓库。

### 会提交到公共仓库的内容

| 路径 | 内容 |
|------|------|
| `content/data/personal.zh.ts` | 仅占位数据（示例公司、示例项目、通用简介） |
| `content/data/personal.en.ts` | 仅占位数据 |
| `content/blog/*/hello-world.mdx` | 示例博客文章 |
| `.env.example` | 仅变量名，不含真实值 |
| `messages/*.json` | UI 文案（导航、按钮等），不含个人信息 |

### 只留在本地（已 gitignore）

| 路径 | 内容 |
|------|------|
| `data/personal.local.json` | 你的真实信息，后台在线编辑后生成 |
| `data/views.json` | 阅读量统计 |
| `data/mail.json` | 邮件通知 SMTP 配置 |
| `content/blog/**/_local/` | 你的真实博客文章 |
| `content/blog/**/_drafts/` | 草稿文章 |
| `.env` / `.env.local` | 环境变量（含管理密码） |

别人克隆你的仓库后，只能得到占位数据；配置 `ADMIN_PASSWORD` 后登录 `/admin` 填入自己的信息，网站就变成 TA 的了。**你可以放心 `git add .` 和 `git commit`**。

## 背景

这个项目的出发点是：一个可以完全掌控、且能安全开源的现代个人网站。它把作品展示、技术博客、后台管理整合进一个仓库，覆盖从本地开发到服务器部署的完整流程。

设计目标：

- **内容优先** —— 不做花哨的装饰，让信息清晰易读
- **暗色赛博绿** —— 长时间阅读不刺眼，支持亮/暗主题切换
- **数据驱动** —— 个人数据、博客内容与代码分离，改数据不动代码
- **隐私优先** —— 真实信息永不进 git，可放心开源
- **部署简单** —— Docker 多阶段构建 + volume 持久化，一条命令上线

## 安装

### 环境要求

- Node.js 18+
- pnpm（推荐，需启用 corepack）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/<your-name>/personal-site.git
cd personal-site

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000/zh（或 `/en`）查看站点。

## 使用

### 快速开始

站点默认显示占位数据。配置环境变量以启用后台：

```bash
# 复制环境变量模板
cp .env.example .env.local
# 编辑 .env.local，至少设置：
ADMIN_PASSWORD=your-strong-password
```

未配置 `ADMIN_PASSWORD` 时后台自动禁用，不影响前台展示。

### 访客终端

全站任意页面按 `~`（或 `⌘K`，或点导航栏终端图标）唤出访客终端——一个接了真实数据的 shell，不是装饰：

| 命令 | 作用 |
|------|------|
| `help` | 列出全部命令（彩蛋不止一个） |
| `ls blog` / `ls projects` / `ls socials` | 看文章 / 项目 / 友链清单 |
| `open <slug>` / `cd contact` | 跳转文章、项目详情或页面区块 |
| `cat about` / `cat resume` / `cat contact` | 读简介、git log 风格的经历、联系方式 |
| `views [slug]` | 查真实阅读量（`/api/views` 接口） |
| `theme light` / `lang en` | 切主题、切语言 |
| `sudo hire-me` | 直达联系区块 |

首次打开会重播开机日志；`Esc` 关闭，`↑↓` 翻历史，`Tab` 补全，状态跨页面保持。

### 后台管理

访问 `/admin` 登录后台，三个标签页：

| 标签 | 功能 |
|------|------|
| 博客文章 | 在线发布/编辑文章，支持中英双语、Markdown 表情短代码、标签逐个添加 |
| 个人信息 | 在线修改站点标题、姓名、简介、社交链接、技能、经历、项目、友链（中英双语分开维护） |
| 邮件通知 | 配置 SMTP，访客留言自动发送到你的邮箱 |

所有修改保存后通过 `revalidatePath` 即时刷新前台，无需重启。

### 自定义

#### 个人信息

后台「个人信息」标签页在线修改全部个人数据，保存到 `data/personal.local.json`（已 gitignore）。读取优先级：JSON 数据 > 占位数据（`personal.zh.ts` / `personal.en.ts`）。

#### UI 文案

编辑 `messages/zh.json` 和 `messages/en.json`，用于导航、按钮、表单标签等。

#### 站点图标

把 `favicon.ico` / `favicon.png` / `favicon.svg` / `icon.png` 任一放进 `data/` 目录（已 gitignore），`/api/favicon` 会动态读取，无需重建。

#### 主题配色

在 `app/globals.css` 中修改 `:root`（暗色）和 `.light`（亮色）的 CSS 变量：

```css
--brand-primary: #10b981;     /* 主色 */
--brand-glow: #34d399;        /* 辉光 / 高亮 */
--gradient-brand: linear-gradient(135deg, #10b981 0%, #22d3ee 100%);
```

#### 添加博客文章

在 `content/blog/zh/` 和 `content/blog/en/` 下各创建一个 `.mdx` 文件（slug 需一致），或直接在后台「博客文章」标签页发布：

```mdx
---
title: "我的文章标题"
description: "用于 SEO 和摘要"
date: "2026-08-02"
tags: ["tag1", "tag2"]
---

文章内容。支持 **Markdown**、GFM 表格、代码高亮，以及 `:rocket:` 表情短代码。
```

#### 开启评论（giscus）

在 GitHub 仓库启用 Discussions，到 [giscus.app](https://giscus.app) 生成配置，填入 `.env.local`：

```bash
NEXT_PUBLIC_GISCUS_REPO=owner/repo
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
```

未配置时评论组件自动隐藏。

#### 联系表单邮件通知

访客在「联系」区块提交留言后，可通过 SMTP 发送到你的邮箱。在后台「邮件通知」标签页配置，或写入环境变量：

```bash
SMTP_HOST=smtp.qq.com          # QQ 邮箱；163: smtp.163.com；企业微信: smtp.exmail.qq.com
SMTP_PORT=465                  # SSL 端口，一般为 465
SMTP_SECURE=true
SMTP_USER=your@qq.com          # 发件邮箱（需开启 SMTP 服务）
SMTP_PASS=your-smtp-auth-code  # 授权码（非登录密码）
```

> QQ 邮箱：设置 → 账号 → 开启「SMTP 服务」，会生成 16 位授权码，填到 `SMTP_PASS`。未配置时留言记录到容器日志，不影响表单提交。

## 部署

### Docker 自托管

```bash
# 1. 在项目根目录创建 .env
cat > .env << 'EOF'
ADMIN_PASSWORD=your-strong-password
NEXT_PUBLIC_SITE_URL=https://your-domain.com
EOF

# 2. 构建并启动
docker compose up -d --build

# 查看日志 / 停止
docker compose logs -f
docker compose down
```

站点运行在 `http://your-server:3000`。`docker-compose.yml` 用两个命名 volume 持久化数据，容器重启、重建都不丢：

- `site-content` → `/app/content`（博客文章）
- `site-data` → `/app/data`（个人信息 JSON + 阅读量 + 邮件配置）

推送到 `main` 会自动触发 SSH 部署（`.github/workflows/deploy.yml`）：服务器上 `git pull` + `docker compose up -d --build`。需在仓库 Secrets 配置 `SSH_HOST` / `SSH_USER` / `SSH_PRIVATE_KEY`。

### Vercel / Netlify

开箱即用，直接推送 Git 仓库导入。部署前把 `NEXT_PUBLIC_SITE_URL` 改成正式域名。

> ⚠️ 平台类部署文件系统只读，后台「在线发博 / 编辑个人信息」依赖写入 `content/` 与 `data/`，需使用 Docker 自托管。

## 项目结构

```
personal-site/
├─ app/
│  ├─ [lang]/                    # zh / en 路由
│  │  ├─ page.tsx                # 首页（Hero / 关于 / 经历 / 技能 / 项目 / 联系）
│  │  ├─ blog/                   # 博客列表 / 文章页 / 标签聚合页
│  │  └─ projects/[slug]/        # 项目详情页
│  ├─ admin/                     # 后台管理页
│  ├─ api/                       # contact / views / favicon / admin 系列接口
│  ├─ layout.tsx                 # 根布局（字体、主题、toast）
│  ├─ globals.css                # 设计系统 + 3D 特效样式
│  ├─ sitemap.ts / robots.ts     # SEO
├─ components/
│  ├─ sections/                  # 首页各区块
│  ├─ admin/                     # 后台编辑器组件
│  ├─ terminal.tsx               # 全局访客终端
│  └─ ...                        # 粒子、3D、导航、页脚等特效组件
├─ content/
│  ├─ data/                      # 占位个人数据 + 读取逻辑
│  └─ blog/                      # zh / en 示例文章
├─ lib/                          # 博客解析、MDX 编译、i18n、邮件、读写工具
├─ messages/                     # zh / en UI 文案
├─ public/                       # 静态资源
├─ Dockerfile                    # 多阶段构建
├─ docker-compose.yml            # 一键部署
└─ LICENSE
```

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | Next.js 16（App Router、RSC） |
| UI | React 19、Tailwind CSS 4 |
| 动画 | Framer Motion + 原生 CSS 3D |
| 内容 | MDX（next-mdx-remote）+ gray-matter + Shiki |
| 图标 | Lucide React + React Icons |
| 评论 | giscus |
| 邮件 | Nodemailer |
| 部署 | Docker（standalone 输出）+ GitHub Actions SSH 自动部署 |

## 维护者

[@shi-YangYang](https://github.com/shi-YangYang)

## 贡献

欢迎提交 issue 和 PR。改动前请先讨论你希望变更的内容。

## 许可证

[MIT](./LICENSE) © 2026
