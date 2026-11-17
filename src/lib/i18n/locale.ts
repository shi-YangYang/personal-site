import { notFound } from "next/navigation";
import { locales, type Locale } from "./index";

export function resolveLocale(lang: string): Locale {
  if (!locales.includes(lang as Locale)) notFound();
  return lang as Locale;
}
