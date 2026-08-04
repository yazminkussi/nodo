import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Eye, RefreshCcw, UserPlus } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { StatusBadge } from './StatusBadge';
import { formatARS } from '../data/mockData';

const iniciales = (a, b) => `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();

const waLink = (socio) => {
  const numero = socio.celular.replace(/\D/g, '');
  const texto = encodeURIComponent(
    `Hola ${socio.nombre} 👋, te escribimos desde el Club Social y Deportivo La Unión. Tu cuota social figura como pendiente. Podés ponerte al día desde la app NODO o respondernos este mensaje. ¡Gracias!`
  );
  return `https://wa.me/${numero}?text=${texto}`;
};

export default function MemberTable() {
  const members = useNodoStore((s) => s.members);
  const toggleCuotaStatus = useNodoStore((s) => s.toggleCuotaStatus);
  const addToast = useNodoStore((s) => s.addToast);
  const setSocioActual = useNodoStore((s) => s.setSocioActual);
  const setRole = useNodoStore((s) => s.setRole);

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return members.filter((m) => {
      const coincideTexto =
        !q ||
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) ||
        m.numero.includes(q) ||
        m.localidad.toLowerCase().includes(q);
      const coincideEstado =
        filtro === 'todos' || (filtro === 'alDia' && m.cuotaAlDia) || (filtro === 'morosos' && !m.cuotaAlDia);
      return coincideTexto && coincideEstado;
    });
  }, [members, busqueda, filtro]);

  const alDia = members.filter((m) => m.cuotaAlDia).length;
  const morosos = members.length - alDia;

  const cambiarEstado = (m) => {
    toggleCuotaStatus(m.id);
    addToast(
      m.cuotaAlDia
        ? `${m.nombre} ${m.apellido} pasó a estado Moroso.`
        : `${m.nombre} ${m.apellido} marcado como Al día. 🎉`,
      m.cuotaAlDia ? 'error' : 'success'
    );
  };

  const verCarnet = (m) => {
    setSocioActual(m.id);
    setRole('socio');
    addToast(`Mostrando el carnet de ${m.nombre} ${m.apellido}.`, 'info');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">Gestión de Socios</h2>
          <p className="text-xs text-slate-500">
            {alDia} al día · {morosos} morosos · {members.length} en total
          </p>
        </div>
        <button
          onClick={() => addToast('Alta de socios disponible en el plan comercial.', 'info')}
          className="inline-flex items-center gap-2 rounded-xl bg-nodo-navy px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-nodo-navy-2"
        >
          <UserPlus size={16} /> Alta de socio
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, N° de socio o barrio…"
            className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-card ring-1 ring-nodo-border placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'alDia', label: 'Al día' },
            { key: 'morosos', label: 'Morosos' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                filtro === f.key ? 'bg-nodo-navy text-white shadow-card' : 'bg-white text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-nodo-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-nodo-border bg-nodo-surface text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">N° Socio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Última cuota</th>
                <th className="px-4 py-3">Cuota</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtrados.map((m) => (
                  <motion.tr
                    key={m.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-nodo-border last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: m.color }}>
                          {iniciales(m.nombre, m.apellido)}
                        </div>
                        <div>
                          <p className="font-bold text-nodo-navy">{m.nombre} {m.apellido}</p>
                          <p className="text-[11px] text-slate-400">{m.localidad}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">N° {m.numero}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{m.categoria}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{m.ultimaCuota}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-600">{formatARS(m.plan)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={m.cuotaAlDia ? 'alDia' : 'moroso'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => verCarnet(m)}
                          title="Ver carnet digital"
                          className="rounded-lg p-2 text-nodo-teal transition hover:bg-cyan-50"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={waLink(m)}
                          target="_blank"
                          rel="noreferrer"
                          title="Recordatorio por WhatsApp"
                          className="rounded-lg p-2 text-nodo-green-dark transition hover:bg-emerald-50"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <button
                          onClick={() => cambiarEstado(m)}
                          title={m.cuotaAlDia ? 'Marcar como moroso' : 'Marcar como al día'}
                          className="rounded-lg p-2 text-nodo-amber transition hover:bg-amber-50"
                        >
                          <RefreshCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">No se encontraron socios con esos criterios.</p>
        )}
      </div>
    </section>
  );
}
