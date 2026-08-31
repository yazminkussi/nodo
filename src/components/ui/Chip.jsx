const tonos = {
  ok: 'bg-ok-soft text-[#1c5a3d]',
  crit: 'bg-crit-soft text-[#9c372f]',
  neutral: 'bg-lav-soft text-lav-deep',
  sun: 'bg-sun-soft text-[#97621b]',
  paper: 'bg-white/12 text-cream',
  sand: 'bg-sand text-ink-soft',
};

export default function Chip({
  tono = 'neutral',
  dot = false,
  icon: Icon,
  children,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold ${tonos[tono]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
