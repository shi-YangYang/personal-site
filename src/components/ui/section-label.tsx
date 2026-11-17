import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-mono text-text-brand",
        className,
      )}
    >
      <span className="h-px w-8 bg-brand-primary/50" />
      <span>{children}</span>
    </div>
  );
}
