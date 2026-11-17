import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/messages";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CursorGlow } from "@/components/effects/cursor-glow";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { ScrollTopButton } from "@/components/layout/scroll-top-button";
import { ClickRipple } from "@/components/effects/click-ripple";
import { Particles } from "@/components/effects/particles";
import { MatrixRain } from "@/components/effects/matrix-rain";
import { AgentConsole } from "@/components/agent/agent-console";
import { BootLoader } from "@/components/terminal/boot-loader";
import { Terminal } from "@/components/terminal/terminal";
import { getPersonalData } from "@content/data";
import { getAllPosts } from "@/lib/content/blog";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  if (!locales.includes(locale)) return {};
  const data = await getPersonalData(locale);
  const siteTitle = data.siteTitle?.trim() || data.name || "Personal Site";
  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  if (!locales.includes(locale)) notFound();
  const messages = await getMessages(locale);
  const data = await getPersonalData(locale);
  const posts = getAllPosts(locale).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    tags: p.tags,
    readingTime: p.readingTime,
  }));

  return (
    <I18nProvider locale={locale} messages={messages}>
      <SmoothScroll>
        <div lang={locale} className="flex-1 flex flex-col">
          <BootLoader />
          <ScrollProgress />
          <Particles />
          <MatrixRain />
          <ClickRipple />
          <CursorGlow />
          <ScrollTopButton />
          <Terminal locale={locale} personal={data} posts={posts} />
          <AgentConsole key={locale} />
          <Navbar />
          <main className="flex-1 flex flex-col pt-24">{children}</main>
          <Footer socials={data.socials} />
        </div>
      </SmoothScroll>
    </I18nProvider>
  );
}
