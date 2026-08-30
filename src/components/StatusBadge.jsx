import { CheckCircle2, AlertTriangle, Clock, CalendarCheck2 } from 'lucide-react';

const estilos = {
  alDia: 'bg-emerald-50 text-nodo-green-dark ring-emerald-200',
  moroso: 'bg-red-50 text-nodo-red ring-red-200',
  pendiente: 'bg-amber-50 text-nodo-amber ring-amber-200',
  confirmada: 'bg-cyan-50 text-nodo-teal ring-cyan-200',
  info: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function StatusBadge({ estado, className = '' }) {
  if (estado === 'alDia') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${estilos.alDia} ${className}`}>
        <CheckCircle2 size={13} strokeWidth={2.5} />
        Al día
      </span>
    );
  }
  if (estado === 'moroso' || estado === 'adeuda') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${estilos.moroso} ${className}`}>
        <AlertTriangle size={13} strokeWidth={2.5} />
        Adeuda
      </span>
    );
  }
  if (estado === 'pendiente') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${estilos.pendiente} ${className}`}>
        <Clock size={13} strokeWidth={2.5} />
        Pendiente
      </span>
    );
  }
  if (estado === 'confirmada') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${estilos.confirmada} ${className}`}>
        <CalendarCheck2 size={13} strokeWidth={2.5} />
        Confirmada
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${estilos.info} ${className}`}>
      {estado}
    </span>
  );
}
