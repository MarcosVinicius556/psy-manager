export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-sky-soft/80 ${className}`} aria-hidden="true" />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-md border border-[#e7eee8] bg-white px-4 py-3">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
