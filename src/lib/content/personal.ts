import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const PERSONAL_FILE = path.join(DATA_DIR, "personal.local.json");

export type SocialsData = {
  github: string;
  csdn: string;
  qq: string;
  x: string;
};

export type SkillItem = { name: string; level: number };
export type SkillGroup = {
  category: string;
  label: string;
  items: SkillItem[];
};

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  tags: string[];
};

export type ProjectItem = {
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  year?: string;
  highlights?: string[];
  tags: string[];
  size: "large" | "small";
  links: { demo?: string; code?: string };
};

export type FriendLinkItem = {
  name: string;
  url: string;
  description: string;
};

export type PersonalDataRecord = {
  name: string;
  initials: string;
  role: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  siteTitle: string;
  socials: SocialsData;
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  friendLinks: FriendLinkItem[];
};

export type PersonalJson = Partial<Record<string, PersonalDataRecord>>;

let cachedMtimeMs = 0;
let cachedJson: PersonalJson | null = null;

export function readPersonalJson(): PersonalJson {
  try {
    if (!fs.existsSync(PERSONAL_FILE)) return {};
    const stat = fs.statSync(PERSONAL_FILE);
    if (stat.mtimeMs === cachedMtimeMs && cachedJson) return cachedJson;
    const raw = fs.readFileSync(PERSONAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as PersonalJson;
    cachedMtimeMs = stat.mtimeMs;
    cachedJson = parsed;
    return parsed;
  } catch {
    return {};
  }
}

export function writePersonalJson(data: PersonalJson): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PERSONAL_FILE, JSON.stringify(data, null, 2), "utf8");
  try {
    cachedMtimeMs = fs.statSync(PERSONAL_FILE).mtimeMs;
  } catch {
    cachedMtimeMs = 0;
  }
  cachedJson = data;
}

export function personalJsonPath(): string {
  return PERSONAL_FILE;
}
