export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-cloud px-6 py-12 text-center">
      {Icon && (
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-lav-soft text-lav">
          <Icon size={20} />
        </span>
      )}
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
