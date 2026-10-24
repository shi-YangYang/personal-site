# Acceptance — Cyber Agent & Python Backend

## Result

PASS（单 Agent 分阶段自检，非独立验收 Agent）

## Spec Coverage

- 保留暗色赛博绿主题：保留 `#050505` / `#10b981`、玻璃、等宽字体、3D 网格、终端。
- 首页布局改造：Hero 改为左右分栏的系统控制台，新增数据雨、扫描线、标题 glitch，项目区改为通栏主项目 + 三列小项目。
- 站内 Agent：右下角 / 导航图标 / `⌘J` 打开，支持中英文提问、引用、建议问题和本地检索。
- Python 后端：FastAPI 接管 `/api/*`；Next.js 完全移除 `app/api` 与 rewrite，浏览器直连 FastAPI，Docker 内由 Caddy 同源反代。
- Docker：单容器同时运行 Caddy、Next standalone 与 uvicorn，只暴露 3000。

## Validation

- Risk Level: S2
- `pnpm build`：通过。
- 新首页/Agent 文件 ESLint：通过。
- 后端 `py_compile`：通过。
- 本地 FastAPI + Next 代理：
  - `/api/health`、`/api/agent/ask`、`/api/contact`、`/api/views/*`、`/api/favicon` 通过。
  - `/api/admin/login` 经 Next 代理设置 cookie；`/admin` 能读到同一会话。
  - 后台 personal / mail / posts 写入后清理测试数据。
- Agent：
  - 中文“怎么联系你”返回邮箱和联系引用。
  - 英文“How do I reach you?”返回英文回答与 `Contact` 引用。
  - 跨页面引用 `#contact` 会解析为 `/zh#contact` 并跳转成功。
- Docker：
  - `docker build -t personal-site:test .` 成功。
  - 单容器运行后 `/zh`、`/en`、`/zh/blog`、`/api/agent/ask`、`/api/favicon`、admin 登录均通过。
- 浏览器：暗色桌面/移动端无横向滚动，Agent 面板可打开/提问，无 console 异常。

## Issues / Known Limitations

- 使用占位个人资料；Agent 回答内容取决于用户真实数据。
- 未配置 LLM Key，验收走 `AGENT / LOCAL` 检索模式。
- 博客/后台保留原视觉，未纳入本轮首页重做范围。
- Docker 构建为规避 Next 16 Turbopack 字体模块问题，使用 `next build --webpack`。

## Direct FastAPI Follow-up

- Next.js `/api/health` 返回 404，确认 `app/api/**` 已删除，Next 不再承担 API。
- 本地开发：`NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` 直连 FastAPI；CORS 预检通过，Agent 与后台登录（`credentials: include`）正常。
- Docker：Caddy 在 3000 同源反代，`/api/health`、`/api/agent/ask`、`/api/favicon`、admin 登录与 `/admin` 均通过。
- Docker 构建已去除 runtime `apt-get`，Python 依赖使用镜像源；Caddy/Node 二进制从官方镜像复制。
