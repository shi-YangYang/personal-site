# Spec — Cyber Agent & Python Backend

## 背景

当前站点是 Next.js + 文件存储的深色赛博绿个人站，后端仅为 Next.js Route Handlers。目标是：

1. 在**不改变现有暗色赛博绿主题**的前提下，改造首页布局、特效和互动，让网站更完整、更有记忆点。
2. 增加一个真正可用的站内 Agent 助手，能基于个人资料、项目、经历、博客回答，并给出引用。
3. 把后端迁移到 Python（FastAPI），用一个 Docker 单容器同时运行 Next.js 前端和 FastAPI，支持本地 Docker 启动。

## 目标

### 视觉与体验

- 保留 `#050505` 深色底、`#10b981 / #34d399` 绿色高亮、玻璃、等宽字体、终端、3D 网格等现有主题。
- 首页从居中 Hero 改为“控制台 + 信号面板”的非对称布局，保留现有 About / Experience / Skills / Projects / Links / Contact。
- 增加至少一个与主题一致的新互动：Agent 控制台（主功能）和一项轻量趣味效果（如可开关的数据雨/扫描线）。
- 不删除现有功能：博客、项目详情、后台、终端、联系表单。

### Agent

- 右下角常驻 Agent 入口，打开后是与终端一致的命令台，不是通用聊天气泡。
- 支持中英文提问，回答基于站内内容，返回引用（项目/经历/文章/联系方式）。
- 无 LLM Key 时使用本地检索 + 抽取式回答；有 OpenAI 兼容 Key 时可调用 LLM，仍以站内内容为上下文。
- 请求有长度限制、超时处理和简单的进程内限流。

### 后端与部署

- FastAPI 接管 `/api/*`：agent、contact、views、favicon、admin login/logout/posts/personal/mail。
- Next.js 只做前端，不再保留任何 `app/api` Route Handler；浏览器通过 `NEXT_PUBLIC_API_BASE_URL` 直连 FastAPI，生产由 Caddy 同源反代 `/api/*` 到 FastAPI。
- 单 Docker 容器：Caddy + Next.js standalone + uvicorn，一个入口端口 3000。
- 保留 `content/`、`data/` 持久化卷；后台写入和前台读取一致。

## 非目标

- 不更换前端框架、不引入数据库、不做多用户权限系统。
- 不改变现有博客/项目 URL。
- 不强制依赖外部 LLM 服务。

## 技术约束

- Python 3.9+（生产建议 3.12），FastAPI + uvicorn。
- 依赖仅：fastapi、uvicorn、json5。
- 前端继续 Next.js 16 + React 19 + TS。
- 单容器内两个进程由启动脚本管理。

## 验收标准

### 后端

- [ ] `uvicorn backend.main:app` 可启动。
- [ ] `POST /api/agent/ask` 返回 answer + citations；无 Key 时仍可用。
- [ ] 联系表单、阅读量、favicon、后台登录/个人资料/邮件/发帖接口可用。
- [ ] 后台写入 `content/`、`data/` 后，Next 前台能读到。
- [ ] 未授权访问后台接口返回 401；未配置 `ADMIN_PASSWORD` 返回 503。

### 前端

- [ ] 首页保留原主题，布局明显升级，桌面/移动端无横向滚动。
- [ ] Agent 面板可打开/关闭，支持提问、加载态、引用、错误态和键盘 Esc。
- [ ] 终端、博客、项目详情、后台仍然可用。

### Docker

- [ ] `docker build -t personal-site .` 成功。
- [ ] `docker run` 单容器启动后 `/zh` 和 `/api/agent/ask` 均可用。
- [ ] `content/`、`data/` 可挂载持久化。

## 待确认

- 真实个人资料和项目截图在用户另一台电脑；本轮使用现有占位数据验证。
- LLM Key 未提供，默认走本地检索模式。
