import { categoryClasses } from "@/lib/types";

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${categoryClasses(label)}`}
    >
      {label}
    </span>
  );
}
