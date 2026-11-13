"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label, ListBox, Select, TextArea } from "@heroui/react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { TagInput } from "./tag-input";
import { PersonalPreview } from "./personal-preview";
import type {
  PersonalDataRecord,
  SkillGroup,
  ExperienceItem,
  ProjectItem,
  FriendLinkItem,
  SkillItem,
} from "@/lib/personal";
import { localeNames, type Locale } from "@/lib/i18n";

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

type Panel = "basic" | "skills" | "experience" | "projects" | "links";

export function PersonalEditor({
  postCounts,
}: {
  postCounts: Record<"zh" | "en", number>;
}) {
  const [data, setData] = useState<Record<Locale, PersonalDataRecord>>({
    zh: createEmptyRecord(),
    en: createEmptyRecord(),
  });
  const [locale, setLocale] = useState<Locale>("zh");
  const [panel, setPanel] = useState<Panel>("basic");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/personal"), {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as Record<Locale, PersonalDataRecord>;
        const next = {
          zh: json.zh ?? createEmptyRecord(),
          en: json.en ?? createEmptyRecord(),
        };
        setData(next);
        setSavedSnapshot(JSON.stringify(next));
      } catch {
        setStatus({ type: "error", text: "加载失败,请重新登录" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const record = data[locale];
  const dirty = savedSnapshot !== "" && JSON.stringify(data) !== savedSnapshot;

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
      setSavedSnapshot(JSON.stringify(data));
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
        <div className="h-8 w-48 rounded bg-bg-elevated" />
        <div className="h-64 w-full rounded-2xl bg-bg-elevated" />
      </div>
    );
  }

  const tabs: { id: Panel; label: string; count?: number }[] = [
    { id: "basic", label: "基本信息" },
    { id: "skills", label: "技能", count: record.skills.length },
    { id: "experience", label: "经历", count: record.experience.length },
    { id: "projects", label: "项目", count: record.projects.length },
    { id: "links", label: "友链", count: record.friendLinks.length },
  ];

  return (
    <div
      key={locale}
      lang={locale}
      data-locale={locale}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="min-w-0 space-y-4">
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
                个人信息
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                内容语言
              </span>
              <div className="flex gap-1.5">
                {(Object.keys(localeNames) as Locale[]).map((lang) => (
                  <Button
                    key={lang}
                    variant="ghost"
                    size="sm"
                    onPress={() => setLocale(lang)}
                    className={cn(
                      "min-h-11 rounded-lg border px-3 py-1.5 text-xs sm:min-h-0",
                      locale === lang
                        ? "border-brand-primary/50 bg-brand-primary/20 text-text-brand"
                        : "border-brand-primary/20 text-text-muted hover:text-text-secondary",
                    )}
                  >
                    {localeNames[lang]}
                  </Button>
                ))}
              </div>
            </div>
            <span className="sr-only" aria-live="polite">
              {locale === "zh" ? "正在编辑中文内容" : "Editing English content"}
            </span>
          </div>

          <nav className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onPress={() => setPanel(tab.id)}
                aria-pressed={panel === tab.id}
                className={cn(
                  "min-h-11 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:min-h-0",
                  panel === tab.id
                    ? "bg-brand-primary/15 text-text-brand"
                    : "text-text-muted hover:bg-brand-primary/5 hover:text-text-secondary",
                )}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span className="text-[10px] opacity-60">{tab.count}</span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        {panel === "basic" && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-brand">
              基本信息
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="姓名 *" value={record.name} onChange={(v) => update({ name: v })} />
              <Field label="首字母" value={record.initials} onChange={(v) => update({ initials: v })} />
              <Field label="职位" value={record.role} onChange={(v) => update({ role: v })} />
              <Field label="标语" value={record.tagline} onChange={(v) => update({ tagline: v })} />
              <Field label="所在地" value={record.location} onChange={(v) => update({ location: v })} />
              <Field label="邮箱" value={record.email} onChange={(v) => update({ email: v })} />
              <Field
                label="站点标题"
                value={record.siteTitle}
                onChange={(v) => update({ siteTitle: v })}
                placeholder="留空则用姓名"
              />
            </div>

            <div className="space-y-1">
              <Label className={labelCls}>简介</Label>
              <TextArea
                fullWidth
                aria-label="简介"
                value={record.bio}
                onChange={(e) => update({ bio: e.target.value })}
                rows={3}
                className="resize-y"
              />
            </div>

            <div>
              <span className={labelCls}>社交链接</span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="GitHub" value={record.socials.github} onChange={(v) => updateSocial({ github: v })} />
                <Field label="CSDN" value={record.socials.csdn} onChange={(v) => updateSocial({ csdn: v })} />
                <Field label="QQ" value={record.socials.qq} onChange={(v) => updateSocial({ qq: v })} />
                <Field label="X" value={record.socials.x} onChange={(v) => updateSocial({ x: v })} />
              </div>
            </div>
          </section>
        )}

        {panel === "skills" && (
          <SkillsEditor
            skills={record.skills}
            onChange={(skills) => updateList("skills", skills)}
          />
        )}

        {panel === "experience" && (
          <ExperienceEditor
            experience={record.experience}
            onChange={(experience) => updateList("experience", experience)}
          />
        )}

        {panel === "projects" && (
          <ProjectsEditor
            projects={record.projects}
            onChange={(projects) => updateList("projects", projects)}
          />
        )}

        {panel === "links" && (
          <FriendLinksEditor
            links={record.friendLinks}
            onChange={(links) => updateList("friendLinks", links)}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            className="min-h-11 sm:min-h-0"
            onPress={onSave}
            isDisabled={saving || !dirty || !record.name.trim()}
          >
            <Save size={16} />
            {saving ? "保存中..." : dirty ? "保存全部更改" : "已保存"}
          </Button>
          {status.text && (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "text-sm",
                status.type === "success" ? "text-emerald-400" : "text-red-400",
              )}
            >
              {status.text}
            </p>
          )}
        </div>
      </div>

      <aside className="min-w-0">
        <PersonalPreview
          record={record}
          locale={locale}
          dirty={dirty}
          panel={panel}
          postCount={postCounts[locale]}
        />
      </aside>
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
    <div className="block space-y-1">
      <Label className={labelCls}>{label}</Label>
      <Input
        fullWidth
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
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
          <Button variant="secondary" size="sm" onPress={onAdd}>
            <Plus size={14} />
            添加
          </Button>
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
  return (
    <div className="flex flex-col gap-0.5">
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={onUp}
        isDisabled={upDisabled}
        className="size-7 min-h-0 text-text-muted hover:text-text-brand"
        aria-label="上移"
      >
        <ArrowUp size={14} />
      </Button>
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={onDown}
        isDisabled={downDisabled}
        className="size-7 min-h-0 text-text-muted hover:text-text-brand"
        aria-label="下移"
      >
        <ArrowDown size={14} />
      </Button>
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
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onDelete}
          className="size-7 min-h-0 text-text-muted hover:text-red-400"
          aria-label="删除"
        >
          <Trash2 size={14} />
        </Button>
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
                  <Input
                    value={item.name}
                    onChange={(e) => setItem(gi, ii, { name: e.target.value })}
                    placeholder="技能名"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={String(item.level)}
                    onChange={(e) => setItem(gi, ii, { level: Number(e.target.value) })}
                    placeholder="熟练度"
                    className="w-24"
                  />
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={() =>
                      setGroup(gi, { items: group.items.filter((_, j) => j !== ii) })
                    }
                    className="size-7 min-h-0 text-text-muted hover:text-red-400"
                    aria-label="删除技能"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onPress={() =>
                  setGroup(gi, { items: [...group.items, { name: "", level: 80 }] })
                }
                className="justify-start px-0 text-xs text-text-brand hover:underline"
              >
                <Plus size={12} />
                添加技能项
              </Button>
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
              <Label className={labelCls}>描述</Label>
              <TextArea
                fullWidth
                aria-label={`${exp.company || "工作经历"} 描述`}
                value={exp.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className="resize-y"
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
                <Label className={labelCls}>卡片尺寸</Label>
                <Select
                  selectedKey={project.size}
                  onSelectionChange={(key) => setItem(i, { size: key === "large" ? "large" : "small" })}
                  aria-label="卡片尺寸"
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="small">小卡片</ListBox.Item>
                      <ListBox.Item id="large">大卡片</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className={labelCls}>简介</Label>
              <TextArea
                fullWidth
                aria-label={`${project.title || "项目"} 简介`}
                value={project.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className="resize-y"
              />
            </div>

            <div className="space-y-1">
              <Label className={labelCls}>详情描述(详情页)</Label>
              <TextArea
                fullWidth
                aria-label={`${project.title || "项目"} 详情描述`}
                value={project.longDescription ?? ""}
                onChange={(e) => setItem(i, { longDescription: e.target.value })}
                rows={2}
                className="resize-y"
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
              <Label className={labelCls}>描述</Label>
              <TextArea
                fullWidth
                aria-label={`${link.name || "友链"} 描述`}
                value={link.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                rows={2}
                className="resize-y"
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
