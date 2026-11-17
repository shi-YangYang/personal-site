import fs from "node:fs";
import path from "node:path";

export function resolveSourceMtime(locale: string, slug: string): number {
  for (const ext of [".mdx", ".md"]) {
    const file = path.join(process.cwd(), "content", "blog", locale, `${slug}${ext}`);
    try {
      return fs.statSync(file).mtimeMs;
    } catch {
      // keep checking
    }
  }
  return 0;
}
