"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { TagInput } from "./tag-input";
import type {
  PersonalDataRecord,
  SkillGroup,
  ExperienceItem,
  ProjectItem,
  FriendLinkItem,
  SkillItem,
} from "@/lib/personal";
import { localeNames, type Locale } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border border-brand-primary/20 bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-brand-primary/60 transition-colors";

const labelCls = "mb-1 block text-xs text-text-secondary";

function createEmptyRecord(): PersonalDataRecord {
  return {
    name: "",
    initials: "",
    role: "",
    tagline: "",
    bio: "",
    location: "",
    email: "",
    siteTitle: "",
    socials: { github: "", csdn: "", qq: "", x: "" },
    skills: [],
    experience: [],
    projects: [],
    friendLinks: [],
  };
}

export function PersonalEditor() {
  const [data, setData] = useState<Record<Locale, PersonalDataRecord>>({
    zh: createEmptyRecord(),
    en: createEmptyRecord(),
  });
  const [locale, setLocale] = useState<Locale>("zh");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>(
    { type: "idle", text: "" },
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/personal"), { credentials: "include" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as Record<Locale, PersonalDataRecord>;
        setData((prev) => ({
          zh: json.zh ?? prev.zh,
          en: json.en ?? prev.en,
        }));
      } catch {
        setStatus({ type: "error", text: "加载失败,请重新登录" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const record = data[locale];

  const update = useCallback(
    (patch: Partial<PersonalDataRecord>) => {
      setData((prev) => ({
        ...prev,
        [locale]: { ...prev[locale], ...patch },
      }));
    },
    [locale],
  );

  function updateSocial(patch: Partial<PersonalDataRecord["socials"]>) {
    update({ socials: { ...record.socials, ...patch } });
  }

  function updateList<K extends "skills" | "experience" | "projects" | "friendLinks">(
    key: K,
    value: PersonalDataRecord[K],
  ) {
    update({ [key]: value } as Partial<PersonalDataRecord>);
  }

  async function onSave() {
    setSaving(true);
    setStatus({ type: "idle", text: "" });
    try {
      const res = await fetch(apiUrl("/api/admin/personal"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ type: "error", text: json?.error ?? "保存失败" });
        return;
      }
      setStatus({ type: "success", text: "已保存,前台页面已更新" });
    } catch {
      setStatus({ type: "error", text: "网络错误,请重试" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-bg-elevated rounded" />
        <div className="h-64 w-full bg-bg-elevated rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
            基本信息
          </h2>
          <div className="flex gap-1.5">
            {(Object.keys(localeNames) as Locale[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs border transition-colors",
                  locale === lang
                    ? "bg-brand-primary/20 border-brand-primary/50 text-text-brand"
                    : "border-brand-primary/20 text-text-muted hover:text-text-secondary",
                )}
              >
                {localeNames[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="姓名 *" value={record.name} onChange={(v) => update({ name: v })} />
          <Field label="首字母" value={record.initials} onChange={(v) => update({ initials: v })} />
          <Field label="职位" value={record.role} onChange={(v) => update({ role: v })} />
          <Field label="标语" value={record.tagline} onChange={(v) => update({ tagline: v })} />
          <Field label="所在地" value={record.location} onChange={(v) => update({ location: v })} />
          <Field label="邮箱" value={record.email} onChange={(v) => update({ email: v })} />
          <Field label="站点标题(浏览器标签页)" value={record.siteTitle} onChange={(v) => update({ siteTitle: v })} placeholder="留空则用姓名" />
        </div>

        <div className="space-y-1">
          <span className={labelCls}>简介</span>
          <textarea
            value={record.bio}
            onChange={(e) => update({ bio: e.target.value })}
            rows={3}
            className={cn(inputCls, "resize-y")}
          />
        </div>

        <div>
          <span className={labelCls}>社交链接</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GitHub" value={record.socials.github} onChange={(v) => updateSocial({ github: v })} />
            <Field label="CSDN" value={record.socials.csdn} onChange={(v) => updateSocial({ csdn: v })} />
            <Field label="QQ" value={record.socials.qq} onChange={(v) => updateSocial({ qq: v })} />
            <Field label="X" value={record.socials.x} onChange={(v) => updateSocial({ x: v })} />
          </div>
        </div>
      </section>

      <SkillsEditor
        skills={record.skills}
        onChange={(skills) => updateList("skills", skills)}
      />

      <ExperienceEditor
        experience={record.experience}
        onChange={(experience) => updateList("experience", experience)}
      />

      <ProjectsEditor
        projects={record.projects}
        onChange={(projects) => updateList("projects", projects)}
      />

      <FriendLinksEditor
        links={record.friendLinks}
        onChange={(links) => updateList("friendLinks", links)}
      />

      {status.text && (
        <p
          className={cn(
            "text-sm",
            status.type === "success" ? "text-emerald-400" : "text-red-400",
          )}
        >
          {status.text}
        </p>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving || !record.name.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-bg-base hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        <Save size={16} />
        {saving ? "保存中..." : "保存全部更改"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </label>
  );
}

function SectionCard({
  title,
  count,
  onAdd,
  children,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
          {title}
          {typeof count === "number" && (
            <span className="ml-2 text-text-muted">({count})</span>
          )}
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-brand hover:border-brand-primary/40 transition-colors"
          >
            <Plus size={14} />
            添加
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function MoveButtons({
  onUp,
  onDown,
  upDisabled,
  downDisabled,
}: {
  onUp: () => void;
  onDown: () => void;
  upDisabled?: boolean;
  downDisabled?: boolean;
}) {
  const base =
    "p-1.5 rounded-lg text-text-muted hover:text-text-brand hover:bg-brand-primary/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted";
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" onClick={onUp} disabled={upDisabled} className={base} aria-label="上移">
        <ArrowUp size={14} />
      </button>
      <button type="button" onClick={onDown} disabled={downDisabled} className={base} aria-label="下移">
        <ArrowDown size={14} />
      </button>
    </div>
  );
}

function ItemShell({
  onDelete,
  move,
  children,
}: {
  onDelete: () => void;
  move?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-brand-primary/15 bg-bg-base/30 p-4 space-y-3">
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {move}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: SkillGroup[];
  onChange: (skills: SkillGroup[]) => void;
}) {
  function setGroup(index: number, patch: Partial<SkillGroup>) {
    onChange(skills.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function setItem(groupIndex: number, itemIndex: number, patch: Partial<SkillItem>) {
    onChange(
      skills.map((g, i) =>
        i === groupIndex
          ? { ...g, items: g.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) }
          : g,
      ),
    );
  }

  return (
    <SectionCard
      title="技能"
      count={skills.length}
      onAdd={() => onChange([...skills, { category: "", label: "", items: [] }])}
    >
      {skills.length === 0 && <p className="text-sm text-text-muted">暂无技能分类</p>}
      <div className="space-y-3">
        {skills.map((group, gi) => (
          <ItemShell
            key={gi}
            onDelete={() => onChange(skills.filter((_, i) => i !== gi))}
            move={
              <MoveButtons
                onUp={() => onChange(move(skills, gi, gi - 1))}
                onDown={() => onChange(move(skills, gi, gi + 1))}
                upDisabled={gi === 0}
                downDisabled={gi === skills.length - 1}
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-16">
              <Field label="分类标识(英文)" value={group.category} onChange={(v) => setGroup(gi, { category: v })} />
              <Field label="分类名称" value={group.label} onChange={(v) => setGroup(gi, { label: v })} />
            </div>
            <div className="space-y-2">
              {group.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2">
                  <input
                    value={item.name}
                    onChange={(e) => setItem(gi, ii, { name: e.target.value })}
                    placeholder="技能名"
                    className={cn(inputCls, "flex-1")}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.level}
                    onChange={(e) => setItem(gi, ii, { level: Number(e.target.value) })}
                    placeholder="熟练度"
                    className={cn(inputCls, "w-24")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGroup(gi, { items: group.items.filter((_, j) => j !== ii) })
                    }
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 transition-colors"
                    aria-label="删除技能"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setGroup(gi, { items: [...group.items, { name: "", level: 80 }] })
                }
                className="inline-flex items-center gap-1 text-xs text-text-brand hover:underline"
              >
                <Plus size={12} />
                添加技能项
              </button>
            </div>
          </ItemShell>
        ))}
      </div>
    </SectionCard>
  );
}

function ExperienceEditor({
  experience,
  onChange,
}: {
  experience: ExperienceItem[];
  onChange: (experience: ExperienceItem[]) => void;
}) {
  function setItem(index: number, patch: Partial<ExperienceItem>) {
    onChange(experience.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  return (
    <SectionCard
      title="工作经历"
      count={experience.length}
      onAdd={() =>
        onChange([
          ...experience,
          { company: "", role: "", period: "", location: "", description: "", tags: [] },
        ])
      }
    >
      {experience.length === 0 && <p className="text-sm text-text-muted">暂无工作经历</p>}
      <div className="space-y-3">
        {experience.map((exp, i) => (
          <ItemShell
            key={i}
            onDelete={() => onChange(experience.filter((_, j) => j !== i))}
            move={
              <MoveButtons
                onUp={() => onChange(move(experience, i, i - 1))}
                onDown={() => onChange(move(experience, i, i + 1))}
                upDisabled={i === 0}
                downDisabled={i === experience.length - 1}
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-16">
              <Field label="公司" value={exp.company} onChange={(v) => setItem(i, { company: v })} />
              <Field label="职位" value={exp.role} onChange={(v) => setItem(i, { role: v })} />
              <Field label="时间段" value={exp.period} onChange={(v) => setItem(i, { period: v })} />
              <Field label="地点" value={exp.location} onChange={(v) => setItem(i, { location: v })} />
            </div>
            <div className="space-y-1">
              <span className={labelCls}>描述</span>
              <textarea
                value={exp.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className={cn(inputCls, "resize-y")}
              />
            </div>
            <div className="space-y-1">
              <span className={labelCls}>标签</span>
              <TagInput
                tags={exp.tags}
                onChange={(tags) => setItem(i, { tags })}
              />
            </div>
          </ItemShell>
        ))}
      </div>
    </SectionCard>
  );
}

function ProjectsEditor({
  projects,
  onChange,
}: {
  projects: ProjectItem[];
  onChange: (projects: ProjectItem[]) => void;
}) {
  function setItem(index: number, patch: Partial<ProjectItem>) {
    onChange(projects.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  return (
    <SectionCard
      title="项目"
      count={projects.length}
      onAdd={() =>
        onChange([
          ...projects,
          {
            slug: "",
            title: "",
            description: "",
            longDescription: "",
            year: "",
            highlights: [],
            tags: [],
            size: "small",
            links: { demo: "", code: "" },
          },
        ])
      }
    >
      {projects.length === 0 && <p className="text-sm text-text-muted">暂无项目</p>}
      <div className="space-y-3">
        {projects.map((project, i) => (
          <ItemShell
            key={i}
            onDelete={() => onChange(projects.filter((_, j) => j !== i))}
            move={
              <MoveButtons
                onUp={() => onChange(move(projects, i, i - 1))}
                onDown={() => onChange(move(projects, i, i + 1))}
                upDisabled={i === 0}
                downDisabled={i === projects.length - 1}
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-16">
              <Field label="Slug(URL 用)" value={project.slug} onChange={(v) => setItem(i, { slug: v })} />
              <Field label="标题" value={project.title} onChange={(v) => setItem(i, { title: v })} />
              <Field label="年份" value={project.year ?? ""} onChange={(v) => setItem(i, { year: v })} />
              <div>
                <span className={labelCls}>卡片尺寸</span>
                <select
                  value={project.size}
                  onChange={(e) => setItem(i, { size: e.target.value === "large" ? "large" : "small" })}
                  className={inputCls}
                >
                  <option value="small">小卡片</option>
                  <option value="large">大卡片</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <span className={labelCls}>简介</span>
              <textarea
                value={project.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className={cn(inputCls, "resize-y")}
              />
            </div>

            <div className="space-y-1">
              <span className={labelCls}>详情描述(详情页)</span>
              <textarea
                value={project.longDescription ?? ""}
                onChange={(e) => setItem(i, { longDescription: e.target.value })}
                rows={2}
                className={cn(inputCls, "resize-y")}
              />
            </div>

            <div className="space-y-1">
              <span className={labelCls}>亮点</span>
              <TagInput
                tags={project.highlights ?? []}
                onChange={(highlights) => setItem(i, { highlights })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className={labelCls}>标签</span>
                <TagInput
                  tags={project.tags}
                  onChange={(tags) => setItem(i, { tags })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Demo 链接" value={project.links.demo ?? ""} onChange={(v) => setItem(i, { links: { ...project.links, demo: v } })} />
                <Field label="源码链接" value={project.links.code ?? ""} onChange={(v) => setItem(i, { links: { ...project.links, code: v } })} />
              </div>
            </div>
          </ItemShell>
        ))}
      </div>
    </SectionCard>
  );
}

function FriendLinksEditor({
  links,
  onChange,
}: {
  links: FriendLinkItem[];
  onChange: (links: FriendLinkItem[]) => void;
}) {
  function setItem(index: number, patch: Partial<FriendLinkItem>) {
    onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <SectionCard
      title="友链"
      count={links.length}
      onAdd={() => onChange([...links, { name: "", url: "", description: "" }])}
    >
      {links.length === 0 && <p className="text-sm text-text-muted">暂无友链</p>}
      <div className="space-y-3">
        {links.map((link, i) => (
          <ItemShell
            key={i}
            onDelete={() => onChange(links.filter((_, j) => j !== i))}
            move={
              <MoveButtons
                onUp={() => onChange(move(links, i, i - 1))}
                onDown={() => onChange(move(links, i, i + 1))}
                upDisabled={i === 0}
                downDisabled={i === links.length - 1}
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-16">
              <Field label="名称" value={link.name} onChange={(v) => setItem(i, { name: v })} />
              <Field label="链接" value={link.url} onChange={(v) => setItem(i, { url: v })} />
            </div>
            <div className="space-y-1">
              <span className={labelCls}>描述</span>
              <textarea
                value={link.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className={cn(inputCls, "resize-y")}
              />
            </div>
          </ItemShell>
        ))}
      </div>
    </SectionCard>
  );
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
