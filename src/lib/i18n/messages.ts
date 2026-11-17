import { notFound } from "next/navigation";
import { defaultLocale, locales, type Locale } from "./index";
import zh from "@messages/zh.json";
import en from "@messages/en.json";

const messages = { zh, en } as const;
export type Messages = (typeof messages)[typeof defaultLocale];

export async function getMessages(locale: string): Promise<Messages> {
  if (!locales.includes(locale as Locale)) notFound();
  return messages[locale as Locale];
}
