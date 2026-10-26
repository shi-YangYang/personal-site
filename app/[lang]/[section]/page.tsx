import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMessages } from "@/lib/messages";
import { resolveLocale } from "@/lib/locale";
import { HomeContent } from "@/components/home-content";
import { isSectionId, type SectionId } from "@/lib/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; section: string }>;
}): Promise<Metadata> {
  const { lang, section } = await params;
  const locale = resolveLocale(lang);
  if (!isSectionId(section)) return {};
  const messages = await getMessages(locale);
  return {
    title: `${messages.nav[section]} — ${messages.hero.title}`,
    description: messages.hero.subtitle,
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ lang: string; section: string }>;
}) {
  const { lang, section } = await params;
  const locale = resolveLocale(lang);
  if (!isSectionId(section)) notFound();
  return <HomeContent locale={locale} section={section as SectionId} />;
}
