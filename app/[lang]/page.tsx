import { getMessages } from "@/lib/messages";
import { resolveLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";

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
  return <HomeContent locale={locale} />;
}
