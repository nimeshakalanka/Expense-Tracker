import type { CategoryRef } from "@/lib/types";

export function CategoryLabel({ category }: { category: CategoryRef }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
      <span className="truncate">{category.name}</span>
    </span>
  );
}
