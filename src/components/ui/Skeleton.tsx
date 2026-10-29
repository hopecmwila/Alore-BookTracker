export function BookCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl2 border border-ink-100 bg-white p-4 shadow-card">
      <div className="h-28 w-20 shrink-0 animate-pulse rounded-lg bg-ink-100" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
        <div className="h-5 w-16 animate-pulse rounded bg-ink-100" />
        <div className="h-2 w-full animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  );
}

export function ShelfGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}
