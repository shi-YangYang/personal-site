import type { Locale } from "@/lib/i18n";
import { personalZh } from "./personal.zh";
import { personalEn } from "./personal.en";
import { readPersonalJson } from "@/lib/content/personal";

export type PersonalData = typeof personalZh;

const fallback: Record<Locale, PersonalData> = {
  zh: personalZh,
  en: personalEn,
};

function mergeData(locale: Locale): PersonalData {
  const base = fallback[locale];
  const override = readPersonalJson()[locale];
  if (!override) return base;
  return {
    ...base,
    ...override,
    socials: { ...base.socials, ...(override.socials ?? {}) },
  } as PersonalData;
}

export async function getPersonalData(
  locale: Locale,
): Promise<PersonalData> {
  return mergeData(locale);
}
