export const SECTION_IDS = [
  "about",
  "experience",
  "skills",
  "projects",
  "links",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

export function sectionHref(locale: string, id: SectionId | "home"): string {
  return id === "home" ? `/${locale}` : `/${locale}/${id}`;
}
