import { getPersonalData } from "@/content/data";
import { getMessages } from "@/lib/messages";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { AboutSection } from "@/components/sections/about";
import { ExperienceSection } from "@/components/sections/experience";
import { SkillsSection } from "@/components/sections/skills";
import { ProjectsSection } from "@/components/sections/projects";
import { LinksSection } from "@/components/sections/links";
import { ContactSection } from "@/components/sections/contact";
import { SectionIndicator } from "@/components/section-indicator";
import { HeroConsole } from "@/components/hero-console";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const messages = await getMessages(locale);
  return {
    description: messages.hero.subtitle,
    openGraph: {
      title: messages.hero.title,
      description: messages.hero.subtitle,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = resolveLocale(lang);
  const data = await getPersonalData(locale);
  const messages = await getMessages(locale);
  const postCount = getAllPosts(locale).length;

  const indicators = [
    { id: "home", label: messages.nav.home },
    { id: "about", label: messages.nav.about },
    { id: "experience", label: messages.nav.experience },
    { id: "skills", label: messages.nav.skills },
    { id: "projects", label: messages.nav.projects },
    { id: "links", label: messages.nav.links },
    { id: "contact", label: messages.nav.contact },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <SectionIndicator items={indicators} />

      <HeroConsole data={data} messages={messages} postCount={postCount} />

      <AboutSection data={data} />
      <ExperienceSection data={data} />
      <SkillsSection data={data} />
      <ProjectsSection data={data} />
      <LinksSection data={data} />
      <ContactSection email={data.email} />
    </div>
  );
}
