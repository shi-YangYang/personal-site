import fs from "node:fs";
import path from "node:path";

const VIEWS_DIR = path.join(process.cwd(), "data");
const VIEWS_FILE = path.join(VIEWS_DIR, "views.json");

type ViewsMap = Record<string, number>;

function readViews(): ViewsMap {
  try {
    if (!fs.existsSync(VIEWS_FILE)) return {};
    return JSON.parse(fs.readFileSync(VIEWS_FILE, "utf8")) as ViewsMap;
  } catch {
    return {};
  }
}

export function getViews(slug: string): number {
  return readViews()[slug] ?? 0;
}

export function incrementViews(slug: string): number {
  const views = readViews();
  const next = (views[slug] ?? 0) + 1;
  views[slug] = next;
  fs.mkdirSync(VIEWS_DIR, { recursive: true });
  fs.writeFileSync(VIEWS_FILE, JSON.stringify(views, null, 2), "utf8");
  return next;
}
