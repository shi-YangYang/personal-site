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
      className="min-h-0 size-8 rounded-full text-text-muted hover:bg-brand-primary/5 hover:text-text-brand"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}
