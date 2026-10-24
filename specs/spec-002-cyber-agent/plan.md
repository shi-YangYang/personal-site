# Plan — Cyber Agent & Python Backend

## 阶段

### Phase 1：Python 后端 + Next 代理

1. `backend/`：FastAPI 应用、配置、鉴权、内容读写、邮件、Agent 检索。
2. 删除 `app/api/**` 与 Node 邮件/发帖 helper；前端统一通过 `lib/api.ts` 读取 `NEXT_PUBLIC_API_BASE_URL` 直连 FastAPI。
3. 本地 venv 启动 uvicorn，逐项替换验证 existing API 客户端。
4. 验收：agent/contact/views/favicon/admin 接口 + 后台页面。
5. 本地 commit。

### Phase 2：首页布局 + Agent UI + 特效

1. 新 Hero：左内容 + 右“系统状态/Agent”面板，保留 3D 网格与代码文字。
2. 新增 Agent Console（右下角，终端风格），接 `/api/agent/ask`。
3. 增加一项可开关的视觉特效（数据雨/扫描线），默认克制。
4. 微调现有 section 的节奏与项目网格，保留所有原有功能。
5. 验收：桌面/移动端截图、键盘、构建。
6. 本地 commit。

### Phase 3：Docker 单容器

1. Dockerfile 改为 Python 3.12 + Node 22 + Caddy 运行时；构建 Next standalone + venv。
2. `start.sh` 启动 uvicorn(127.0.0.1:8000) + Next(127.0.0.1:3001) + Caddy(3000)。
3. docker-compose 单 service，保留 content/data volume。
4. 验收：build、run、/zh、/api/agent/ask、后台登录。
5. 本地 commit。

## 涉及文件

- 新增：`backend/main.py`、`backend/config.py`、`backend/auth.py`、`backend/content.py`、`backend/mail.py`、`backend/agent.py`、`backend/requirements.txt`
- 修改：`next.config.ts`
- 新增：`components/agent-console.tsx`
- 修改：`app/[lang]/page.tsx`、`components/hero-3d.tsx`、`app/globals.css`、`app/[lang]/layout.tsx`
- 修改：`Dockerfile`、`docker-compose.yml`、`.dockerignore`
- 新增：`start.sh`
- 文档：README 增加 Python/Docker/Agent 说明

## 风险

- 单容器双进程：uvicorn 崩溃不会自动杀掉 node；启动脚本做基本守护，Docker restart 兜底。
- Caddy 同源反代保持 admin cookie 兼容；本地 dev 用 CORS + `credentials: include` 直连 FastAPI。
- 现有页面 `force-dynamic`，Python 写文件后无需 revalidate；后续若改静态需补 revalidate。
- 无 LLM Key 时回答为抽取式，质量取决于站内资料完整度。
