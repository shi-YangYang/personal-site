import { cn } from "@/lib/utils";

export function Code3D({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div className={cn("code-3d", className)} aria-hidden>
      <span className="code-3d-text">{code}</span>
    </div>
  );
}
