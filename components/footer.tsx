"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, useI18n } from "./i18n-provider";
import { Code3D } from "./code-3d";
import { FaGithub, FaQq, FaXTwitter } from "react-icons/fa6";
import { Mail, ArrowUp } from "lucide-react";
import { CsdnIcon } from "./csdn-icon";
import { cn } from "@/lib/utils";

const GithubIcon = FaGithub as unknown as React.FC<{ size?: number }>;
const QqIcon = FaQq as unknown as React.FC<{ size?: number }>;
const XIcon = FaXTwitter as unknown as React.FC<{ size?: number }>;

const quickLinks = [
  { key: "nav.home", href: "" },
  { key: "nav.blog", href: "/blog" },
  { key: "nav.projects", href: "#projects" },
  { key: "nav.contact", href: "#contact" },
] as const;

const sectionLinks = [
  { key: "nav.about", href: "#about" },
  { key: "nav.experience", href: "#experience" },
  { key: "nav.skills", href: "#skills" },
  { key: "nav.projects", href: "#projects" },
  { key: "nav.links", href: "#links" },
  { key: "nav.contact", href: "#contact" },
] as const;

export function Footer({ socials }: { socials: {
  github?: string;
  csdn?: string;
  qq?: string;
  x?: string;
  email?: string;
} }) {
  const t = useT();
  const { locale } = useI18n();
  const pathname = usePathname();
  const year = new Date().getFullYear();
  // Only the home page gets segmented-snap footer.
  const snap = pathname === `/${locale}`;
  const home = `/${locale}`;

  const items = [
    socials.github && { href: socials.github, icon: GithubIcon, label: "GitHub" },
    socials.csdn && { href: socials.csdn, icon: CsdnIcon, label: "CSDN" },
    socials.qq && { href: socials.qq, icon: QqIcon, label: "QQ" },
    socials.x && { href: socials.x, icon: XIcon, label: "X" },
    socials.email && { href: `mailto:${socials.email}`, icon: Mail, label: "Email" },
  ].filter(Boolean) as Array<{ href: string; icon: React.ComponentType<{ size?: number }>; label: string }>;

  return (
    <footer
      className={cn(
        "relative border-t border-white/5",
        snap ? "snap-section" : "mt-16",
      )}
    >
      <Code3D
        className="right-[4%] top-[12%] opacity-25 text-2xl md:text-4xl hidden md:block"
        code={`console.log("${t("footer.thanks")}")`}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 w-full flex-1 flex flex-col justify-center">
        <div className="grid gap-10 md:grid-cols-3 py-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-brand-glow">▸</span>
              <span className="text-text-primary">~/personal-site</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              {t("footer.bio")}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="p-2 rounded-lg text-text-muted hover:text-text-brand hover:bg-brand-primary/5 transition-colors"
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-brand mb-4">
              {t("footer.links")}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.key}>
                  <FooterLink href={`${home}${l.href}`} label={t(l.key)} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-brand mb-4">
              {t("footer.sections")}
            </h3>
            <ul className="space-y-2">
              {sectionLinks.map((l) => (
                <li key={l.key}>
                  <FooterLink href={`${home}${l.href}`} label={t(l.key)} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-text-muted">
          <span>
            © {year} · {t("footer.built_with")} · {t("footer.rights")}
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-brand transition-colors"
          >
            <ArrowUp size={12} />
            {t("footer.top")}
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-brand transition-colors"
    >
      <span className="text-brand-glow/40 group-hover:text-brand-glow transition-colors">
        ▸
      </span>
      {label}
    </Link>
  );
}
