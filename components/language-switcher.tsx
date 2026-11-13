"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@heroui/react";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const segments = pathname.split("/");
  const currentLocale = (segments[1] ?? "zh") as Locale;
  const rest = segments.slice(2).join("/");

  const switchTo = (next: Locale) => {
    if (next === currentLocale) return;
    startTransition(() => {
      router.push(`/${next}${rest ? `/${rest}` : ""}`);
    });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-brand-primary/20 bg-bg-base/50 text-xs font-mono">
      {locales.map((loc) => (
        <Button
          key={loc}
          variant="ghost"
          size="sm"
          onPress={() => switchTo(loc)}
          isDisabled={pending}
          className={cn(
            "min-h-11 rounded-full px-3 py-1 text-xs md:min-h-9",
            currentLocale === loc
              ? "bg-brand-primary text-bg-base font-medium"
              : "text-text-muted hover:bg-brand-primary/10 hover:text-text-secondary",
          )}
          aria-label={localeNames[loc]}
        >
          {loc.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
