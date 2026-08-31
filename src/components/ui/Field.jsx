/* Campo de formulario con label e icono opcional. */
export default function Field({ label, icon: Icon, hint, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-bold text-ink-soft">{label}</span>}
      <span className="relative block">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        )}
        <input
          className={`w-full rounded-xl border border-line bg-cloud py-2.5 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-lav ${
            Icon ? 'pl-9' : 'pl-3'
          } ${error ? 'border-crit' : ''}`}
          {...props}
        />
      </span>
      {error && <span className="mt-1 block text-xs font-semibold text-crit">{error}</span>}
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
