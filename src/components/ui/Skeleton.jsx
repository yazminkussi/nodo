/* Bloque de carga. `lines` para filas de texto; sin lines, un rectángulo. */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-sand ${className}`} />;
}

export function SkeletonList({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-line bg-cloud p-4"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
