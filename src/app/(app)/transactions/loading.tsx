import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading transactions" className="grid gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-2 rounded-xl border p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
