"use client";

import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, X } from "lucide-react";

export function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const value = draft.trim().replace(/[,，]/g, "").trim();
    if (!value) return;
    if (tags.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? "输入后回车或点击添加"}
          className="flex-1"
        />
        <Button
          variant="secondary"
          size="sm"
          onPress={addTag}
          className="shrink-0"
        >
          <Plus size={14} />
          添加
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-text-brand/90"
            >
              #{tag}
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => removeTag(tag)}
                className="min-h-0 size-5 text-text-muted hover:text-red-400"
                aria-label={`删除标签 ${tag}`}
              >
                <X size={12} />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
