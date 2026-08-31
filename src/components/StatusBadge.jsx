import { CheckCircle2, AlertTriangle, Clock, CalendarCheck2 } from 'lucide-react';

const config = {
  alDia: { cls: 'bg-ok-soft text-[#1c5a3d]', icon: CheckCircle2, label: 'Al día' },
  moroso: { cls: 'bg-crit-soft text-[#9c372f]', icon: AlertTriangle, label: 'Adeuda' },
  adeuda: { cls: 'bg-crit-soft text-[#9c372f]', icon: AlertTriangle, label: 'Adeuda' },
  pendiente: { cls: 'bg-sun-soft text-[#97621b]', icon: Clock, label: 'Pendiente' },
  confirmada: { cls: 'bg-lav-soft text-lav-deep', icon: CalendarCheck2, label: 'Confirmada' },
};

export function StatusBadge({ estado, className = '' }) {
  const c = config[estado];
  if (!c) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg bg-sand px-2 py-0.5 text-xs font-bold text-ink-soft ${className}`}
      >
        {estado}
      </span>
    );
  }
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${c.cls} ${className}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {c.label}
    </span>
  );
}
