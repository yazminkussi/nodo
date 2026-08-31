import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Keyboard,
  Trash2,
  Clock,
} from 'lucide-react';
import { useNodoStore } from '../../store/useNodoStore';

const badgeResultado = {
  permitido: {
    icono: CheckCircle2,
    clases: 'bg-ok-soft text-ok ring-emerald-200',
    label: 'Permitido',
  },
  denegado: {
    icono: XCircle,
    clases: 'bg-crit-soft text-crit ring-red-200',
    label: 'Adeuda',
  },
  invalido: {
    icono: AlertTriangle,
    clases: 'bg-sun-soft text-warn ring-amber-200',
    label: 'Inválido',
  },
};

export function AccessLogTable() {
  const registros = useNodoStore((s) => s.registrosAcceso);
  const clearRegistrosAcceso = useNodoStore((s) => s.clearRegistrosAcceso);
  const addToast = useNodoStore((s) => s.addToast);

  const [filtro, setFiltro] = useState('todos');

  const filtrados = useMemo(() => {
    if (filtro === 'todos') return registros;
    return registros.filter((r) => r.resultado === filtro);
  }, [registros, filtro]);

  const conteo = useMemo(
    () => ({
      permitido: registros.filter((r) => r.resultado === 'permitido').length,
      denegado: registros.filter((r) => r.resultado === 'denegado').length,
      invalido: registros.filter((r) => r.resultado === 'invalido').length,
    }),
    [registros]
  );

  const formatearFecha = (iso) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) +
      ' · ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lav-deep text-white">
            <History size={17} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-ink">
              Historial de Ingresos
            </h3>
            <p className="text-[11px] font-semibold text-ink-faint">
              {registros.length} eventos registrados en total
            </p>
          </div>
        </div>
        {registros.length > 0 && (
          <button
            onClick={() => {
              clearRegistrosAcceso();
              addToast('Historial de ingresos borrado.', 'info');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink-faint transition hover:bg-crit-soft hover:text-crit"
          >
            <Trash2 size={14} /> Vaciar
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'permitido', label: 'Permitidos' },
          { key: 'denegado', label: 'Con Adeuda' },
          { key: 'invalido', label: 'Inválidos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filtro === f.key
                ? 'bg-lav-deep text-white shadow-card'
                : 'bg-white text-ink-soft ring-1 ring-inset ring-line hover:bg-paper'
            }`}
          >
            {f.label}
            {f.key !== 'todos' && (
              <span className={`ml-1 ${filtro === f.key ? 'text-white/60' : 'text-ink-faint'}`}>
                {conteo[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Estado al ingreso</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Escaneado por</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtrados.map((r) => {
                  const cfg = badgeResultado[r.resultado] || badgeResultado.invalido;
                  const Icono = cfg.icono;
                  return (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-line last:border-0 hover:bg-paper/70"
                      title={r.motivo || ''}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                          <Clock size={12} className="text-slate-300" />
                          {formatearFecha(r.timestamp)}
                        </span>
                        {r.reserva && r.resultado === 'permitido' && (
                          <p className="mt-0.5 text-[10px] font-bold text-lav">
                            {r.reserva.espacioNombre} · {r.reserva.hora} hs
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-ink">
                        {r.nombre || '—'}
                        <p className="text-[10px] font-semibold text-ink-faint">
                          {r.estadoAlIngreso}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-ink-soft">
                        {r.numeroSocio || r.numero || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-ink-soft">
                          {r.estadoAlIngreso}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ring-inset ${cfg.clases}`}
                        >
                          <Icono size={12} />
                          {cfg.label}
                        </span>
                        {r.override && (
                          <span className="mt-1 block text-[10px] font-semibold text-ink-faint">
                            Ingreso permitido por administración
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
                          {r.metodo === 'manual' ? <Keyboard size={12} /> : <QrCode size={12} />}
                          {r.metodo === 'manual' ? 'Manual' : 'QR'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-soft">
                        {r.escaneadoPor || '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {registros.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <History size={28} className="text-slate-300" />
            <p className="text-sm font-bold text-ink-soft">Todavía no hay ingresos registrados</p>
            <p className="text-xs text-ink-faint">
              Escaneá un QR o usá el ingreso manual para registrar el primer evento.
            </p>
          </div>
        )}
        {registros.length > 0 && filtrados.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-faint">
            No hay eventos con ese filtro.
          </p>
        )}
      </div>
    </section>
  );
}

export default AccessLogTable;
