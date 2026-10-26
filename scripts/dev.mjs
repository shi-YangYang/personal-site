#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uvicorn = path.join(root, "backend", ".venv", "bin", "uvicorn");
const nextBin = path.join(root, "node_modules", ".bin", "next");
const colors = { api: "\x1b[36m", web: "\x1b[35m", reset: "\x1b[0m" };

if (!existsSync(uvicorn)) {
  console.error(
    "\n缺少 backend/.venv。先运行：\n" +
      "  python3 -m venv backend/.venv\n" +
      "  backend/.venv/bin/pip install -r backend/requirements.txt\n",
  );
  process.exit(1);
}
if (!existsSync(nextBin)) {
  console.error("\n缺少 node_modules。先运行 pnpm install。\n");
  process.exit(1);
}

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function pickApiPort() {
  const requested = Number(process.env.API_PORT || 0);
  if (requested) {
    if (await isFree(requested)) return requested;
    throw new Error(`API_PORT=${requested} 已被占用`);
  }
  for (let port = 8000; port < 8020; port += 1) {
    if (await isFree(port)) return port;
  }
  throw new Error("8000-8019 没有可用端口，请设置 API_PORT");
}

function prefix(child, label) {
  const color = colors[label] || "";
  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) continue;
    readline.createInterface({ input: stream }).on("line", (line) => {
      console.log(`${color}[${label}]${colors.reset} ${line}`);
    });
  }
}

async function waitForApi(port, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {
      // API is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`FastAPI 在 ${timeoutMs / 1000}s 内没有就绪`);
}

let api;
let web;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of [web, api]) {
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch {
        // ignore
      }
    }
  }
  setTimeout(() => process.exit(code), 700);
}

async function main() {
  const apiPort = await pickApiPort();
  const webPort = Number(process.env.WEB_PORT || 3000);

  if (!(await isFree(webPort))) {
    throw new Error(`WEB_PORT=${webPort} 已被占用`);
  }

  console.log(`\n启动本地开发环境`);
  console.log(`  API  http://localhost:${apiPort}`);
  console.log(`  Web  http://localhost:${webPort}/zh\n`);

  api = spawn(
    uvicorn,
    ["backend.main:app", "--reload", "--host", "127.0.0.1", "--port", String(apiPort)],
    { cwd: root, env: { ...process.env, PYTHONUNBUFFERED: "1" } },
  );
  prefix(api, "api");

  api.on("exit", (code) => {
    if (!stopping) {
      console.error(`[api] 退出，code=${code ?? 1}`);
      stop(code ?? 1);
    }
  });

  await waitForApi(apiPort);

  web = spawn(nextBin, ["dev", "-p", String(webPort)], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: `http://localhost:${apiPort}`,
    },
  });
  prefix(web, "web");

  web.on("exit", (code) => {
    if (!stopping) {
      console.error(`[web] 退出，code=${code ?? 1}`);
      stop(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

main().catch((error) => {
  console.error(`\n${error instanceof Error ? error.message : error}\n`);
  stop(1);
});
