"use client";

import { Button } from "@heroui/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onPress={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="size-11 min-h-0 rounded-full text-text-muted hover:bg-brand-primary/5 hover:text-text-brand md:size-8"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
