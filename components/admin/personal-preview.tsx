"use client";

import { localeNames, type Locale } from "@/lib/i18n";
import type { PersonalDataRecord } from "@/lib/personal";

type PreviewPanel = "basic" | "skills" | "experience" | "projects" | "links";

const copy = {
  zh: {
    view: "查看作品",
    agent: "问我的系统…",
    ready: "站内检索就绪",
    projects: "项目",
    skills: "技能组",
    experience: "经历",
    skillsLabel: "技能",
    skillsTitle: "技术栈",
    experienceLabel: "经历",
    experienceTitle: "工作经历",
    projectsLabel: "项目",
    projectsTitle: "精选作品",
    linksLabel: "友链",
    linksTitle: "友情链接",
    empty: "还没有内容。",
  },
  en: {
    view: "View work",
    agent: "Ask my system…",
    ready: "site retrieval ready",
    projects: "Projects",
    skills: "Skill groups",
    experience: "Roles",
    skillsLabel: "Skills",
    skillsTitle: "Stack",
    experienceLabel: "Experience",
    experienceTitle: "Experience",
    projectsLabel: "Projects",
    projectsTitle: "Selected work",
    linksLabel: "Links",
    linksTitle: "Links",
    empty: "Nothing here yet.",
  },
} as const;

export function PersonalPreview({
  record,
  locale,
  dirty,
  panel,
}: {
  record: PersonalDataRecord;
  locale: Locale;
  dirty: boolean;
  panel: PreviewPanel;
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-brand-primary/15 bg-bg-base">
        <div className="flex items-center justify-between border-b border-brand-primary/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em]">
          <span className="text-text-brand">实时预览</span>
          <span className="text-text-muted">
            {localeNames[locale]} · {dirty ? "未保存" : "已保存"}
          </span>
        </div>

        <div className="relative min-h-[360px]">
          <div className="absolute inset-0 bg-grid opacity-15" />
          {panel === "basic" ? (
            <BasicPreview record={record} locale={locale} />
          ) : panel === "skills" ? (
            <SkillsPreview record={record} locale={locale} />
          ) : panel === "experience" ? (
            <ExperiencePreview record={record} locale={locale} />
          ) : panel === "projects" ? (
            <ProjectsPreview record={record} locale={locale} />
          ) : (
            <LinksPreview record={record} locale={locale} />
          )}
        </div>
      </div>
      <p className="px-1 text-[10px] leading-relaxed text-text-muted">
        预览使用当前编辑中的数据，不会自动保存。
      </p>
    </div>
  );
}

function BasicPreview({
  record,
  locale,
}: {
  record: PersonalDataRecord;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <div className="relative p-5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 font-mono text-[9px] text-text-brand">
        <span className="size-1.5 rounded-full bg-brand-glow" />
        {record.role || "全栈工程师"}
      </span>

      <h3 className="mt-3 text-[clamp(2rem,4vw,2.6rem)] font-bold leading-[0.95] tracking-[-0.045em] text-text-primary">
        {record.name || "你的名字"}
      </h3>
      <p className="mt-1 text-lg font-semibold text-gradient">
        {record.tagline || "一句话定位"}
      </p>
      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-text-secondary">
        {record.bio || "简介会实时显示在这里。"}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-3 py-1.5 text-[10px] font-medium text-bg-base">
        {t.view} →
      </span>

      <div className="mt-5 overflow-hidden rounded-xl border border-brand-primary/15 bg-bg-elevated/70">
        <div className="flex items-center justify-between border-b border-brand-primary/10 px-3 py-2 font-mono text-[8px] text-text-muted">
          <span>operator@personal-site</span>
          <span className="flex items-center gap-1">
            <span className="size-1 rounded-full bg-brand-glow" />
            在线
          </span>
        </div>
        <div className="space-y-2 px-3 py-3 font-mono text-[9px] leading-relaxed">
          <p className="text-text-muted">
            <span className="text-brand-glow">$</span> whoami
            <span className="mt-0.5 block pl-3 text-text-primary">
              {record.name || "你的名字"} / {record.role || "全栈工程师"}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-text-muted">
            <span className="text-brand-glow">$</span> agent --status
            <span className="ml-auto rounded-full bg-brand-primary/10 px-2 py-0.5 text-[8px] text-text-brand">
              {t.ready}
            </span>
          </p>
          <div className="flex items-center gap-1.5 rounded-md bg-bg-base px-2 py-1.5 text-[9px] text-text-muted">
            <span className="text-brand-glow">$</span>
            {t.agent}
            <span className="ml-auto text-brand-glow">→</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-brand-primary/10 pt-3 font-mono text-[8px] uppercase tracking-[0.08em] text-text-muted">
        <div>
          <b className="block text-xs font-normal text-text-brand">
            {String(record.projects.length).padStart(2, "0")}
          </b>
          {t.projects}
        </div>
        <div>
          <b className="block text-xs font-normal text-text-brand">
            {String(record.skills.length).padStart(2, "0")}
          </b>
          {t.skills}
        </div>
        <div>
          <b className="block text-xs font-normal text-text-brand">
            {String(record.experience.length).padStart(2, "0")}
          </b>
          {t.experience}
        </div>
      </div>
    </div>
  );
}

function SkillsPreview({
  record,
  locale,
}: {
  record: PersonalDataRecord;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <div className="relative p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-brand">
        {t.skillsLabel}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
        {t.skillsTitle}
      </h3>
      <div className="mt-5 space-y-4">
        {record.skills.length === 0 ? (
          <p className="text-xs text-text-muted">{t.empty}</p>
        ) : (
          record.skills.map((group) => (
            <div
              key={group.category || group.label}
              className="border-t border-brand-primary/10 pt-3"
            >
              <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-text-brand">
                {group.label || "未命名分类"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-secondary">
                {group.items.map((item) => (
                  <span key={item.name}>{item.name}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExperiencePreview({
  record,
  locale,
}: {
  record: PersonalDataRecord;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <div className="relative p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-brand">
        {t.experienceLabel}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
        {t.experienceTitle}
      </h3>
      <div className="mt-5 space-y-4">
        {record.experience.length === 0 ? (
          <p className="text-xs text-text-muted">{t.empty}</p>
        ) : (
          record.experience.map((item) => (
            <div
              key={`${item.company}-${item.period}`}
              className="border-t border-brand-primary/10 pt-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">
                  {item.role || "职位"}
                  <span className="text-text-muted"> · {item.company || "公司"}</span>
                </p>
                <span className="shrink-0 font-mono text-[8px] text-text-muted">
                  {item.period}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-text-secondary">
                {item.description || "描述会显示在这里。"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProjectsPreview({
  record,
  locale,
}: {
  record: PersonalDataRecord;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <div className="relative p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-brand">
        {t.projectsLabel}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
        {t.projectsTitle}
      </h3>
      <div className="mt-5 space-y-3">
        {record.projects.length === 0 ? (
          <p className="text-xs text-text-muted">{t.empty}</p>
        ) : (
          record.projects.map((project, index) => (
            <div
              key={project.slug || project.title || index}
              className="border-t border-brand-primary/10 pt-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">
                  <span className="mr-2 font-mono text-[8px] text-text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {project.title || "未命名项目"}
                </p>
                <span className="shrink-0 font-mono text-[8px] text-text-muted">
                  {project.year}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-text-secondary">
                {project.description || "项目描述会显示在这里。"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {project.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-brand-primary/15 px-1.5 py-0.5 font-mono text-[8px] text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LinksPreview({
  record,
  locale,
}: {
  record: PersonalDataRecord;
  locale: Locale;
}) {
  const t = copy[locale];
  return (
    <div className="relative p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-brand">
        {t.linksLabel}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
        {t.linksTitle}
      </h3>
      <div className="mt-5 space-y-3">
        {record.friendLinks.length === 0 ? (
          <p className="text-xs text-text-muted">{t.empty}</p>
        ) : (
          record.friendLinks.map((link) => (
            <div
              key={link.url || link.name}
              className="border-t border-brand-primary/10 pt-3"
            >
              <p className="text-sm font-medium text-text-primary">
                {link.name || "未命名友链"}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-text-secondary">
                {link.description || "友链描述"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
