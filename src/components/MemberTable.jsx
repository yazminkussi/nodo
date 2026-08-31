import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Eye, RefreshCcw, UserPlus, AlertCircle } from 'lucide-react';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { useComunidadActiva } from '../store/useSesion';
import { useSocios } from '../hooks/useSocios';
import { StatusBadge } from './StatusBadge';
import { formatARS } from '../data/mockData';
import SocioFormModal from './SocioFormModal';
import SectionTitle from './ui/SectionTitle';
import Button from './ui/Button';
import { SkeletonList } from './ui/Skeleton';

const iniciales = (a, b) => `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();

const waLink = (socio, comunidadNombre) => {
  const numero = (socio.celular || '').replace(/\D/g, '');
  const texto = encodeURIComponent(
    `Hola ${socio.nombre} 👋, te escribimos desde ${comunidadNombre}. Tu cuota social figura como pendiente. Podés ponerte al día desde la app NODO o respondernos este mensaje. ¡Gracias!`
  );
  return `https://wa.me/${numero}?text=${texto}`;
};

export default function MemberTable() {
  const {
    modo,
    socios: members,
    cargando,
    error,
    registrarPago,
    toggleCuota,
    crear,
    actualizar,
  } = useSocios();
  const addToast = useNodoStore((s) => s.addToast);
  const setSocioActual = useNodoStore((s) => s.setSocioActual);
  const setRole = useNodoStore((s) => s.setRole);
  const comunidadDemo = useComunidadActual();
  const comunidadReal = useComunidadActiva();
  const comunidad = comunidadReal || comunidadDemo;

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [formAbierto, setFormAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return members.filter((m) => {
      const coincideTexto =
        !q ||
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) ||
        m.numero.includes(q) ||
        (m.localidad || '').toLowerCase().includes(q);
      const coincideEstado =
        filtro === 'todos' ||
        (filtro === 'alDia' && m.cuotaAlDia) ||
        (filtro === 'morosos' && !m.cuotaAlDia);
      return coincideTexto && coincideEstado;
    });
  }, [members, busqueda, filtro]);

  const alDia = members.filter((m) => m.cuotaAlDia).length;
  const morosos = members.length - alDia;

  const cambiarEstado = async (m) => {
    try {
      await toggleCuota(m.id);
      addToast(
        m.cuotaAlDia
          ? `${m.nombre} ${m.apellido} pasó a estado Adeuda.`
          : `${m.nombre} ${m.apellido} marcado como Al día. 🎉`,
        m.cuotaAlDia ? 'error' : 'success'
      );
    } catch {
      addToast('No se pudo actualizar el estado de la cuota.', 'error');
    }
  };

  const marcarPago = async (m) => {
    try {
      await registrarPago(m.id);
      addToast(`Pago registrado para ${m.nombre} ${m.apellido}.`, 'success');
    } catch {
      addToast('No se pudo registrar el pago.', 'error');
    }
  };

  const verCarnet = (m) => {
    setSocioActual(m.id);
    setRole('socio');
    addToast(`Mostrando el carnet de ${m.nombre} ${m.apellido}.`, 'info');
  };

  const abrirAlta = () => {
    if (modo === 'demo') {
      addToast('El alta de socios se habilita con la cuenta conectada a Supabase.', 'info');
      return;
    }
    setEnEdicion(null);
    setFormAbierto(true);
  };

  const abrirEdicion = (m) => {
    setEnEdicion(m);
    setFormAbierto(true);
  };

  const guardar = async (datos) => {
    if (enEdicion) {
      await actualizar(enEdicion.id, datos);
      addToast('Socio actualizado.', 'success');
    } else {
      await crear(datos);
      addToast('Socio dado de alta.', 'success');
    }
    setFormAbierto(false);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionTitle
        title="Gestión de socios"
        subtitle={`${alDia} al día · ${morosos} adeudan · ${members.length} en total${
          modo === 'demo' ? ' · datos de demostración' : ''
        }`}
        action={
          <Button variant="lav" onClick={abrirAlta}>
            <UserPlus size={16} /> Alta de socio
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, N° de socio o barrio…"
            className="w-full rounded-xl border border-line bg-cloud py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-lav"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'alDia', label: 'Al día' },
            { key: 'morosos', label: 'Adeudan' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                filtro === f.key
                  ? 'bg-lav-deep text-cream'
                  : 'border border-line bg-cloud text-ink-soft hover:bg-sand'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-crit-soft px-4 py-3 text-sm font-semibold text-[#9c372f]">
          <AlertCircle size={16} /> No se pudieron cargar los socios: {error.message}
        </div>
      )}

      {cargando && filtrados.length === 0 ? (
        <SkeletonList rows={5} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-cloud shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-[11px] font-bold uppercase tracking-wider text-ink-faint">
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
                      className="border-b border-line last:border-0 hover:bg-paper"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => modo === 'remoto' && abrirEdicion(m)}
                          className="flex items-center gap-3 text-left"
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white"
                            style={{ background: m.color }}
                          >
                            {iniciales(m.nombre, m.apellido)}
                          </div>
                          <div>
                            <p className="font-bold text-ink">
                              {m.nombre} {m.apellido}
                            </p>
                            <p className="text-[11px] text-ink-faint">{m.localidad}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-ink-soft">
                        N° {m.numero}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-soft">
                        {m.categoria}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">{m.ultimaCuota || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold tabular-nums text-ink-soft">
                        {formatARS(m.plan)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge estado={m.cuotaAlDia ? 'alDia' : 'moroso'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {modo === 'demo' && (
                            <button
                              onClick={() => verCarnet(m)}
                              title="Ver carnet digital"
                              className="rounded-lg p-2 text-lav transition hover:bg-lav-soft"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {!m.cuotaAlDia && (
                            <a
                              href={waLink(m, comunidad.nombre)}
                              target="_blank"
                              rel="noreferrer"
                              title="Recordatorio por WhatsApp"
                              className="rounded-lg p-2 text-ok transition hover:bg-ok-soft"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          {!m.cuotaAlDia ? (
                            <button
                              onClick={() => marcarPago(m)}
                              title="Registrar pago de cuota"
                              className="rounded-lg p-2 text-ok transition hover:bg-ok-soft"
                            >
                              <RefreshCcw size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => cambiarEstado(m)}
                              title="Marcar como adeuda"
                              className="rounded-lg p-2 text-warn transition hover:bg-sun-soft"
                            >
                              <RefreshCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {!cargando && filtrados.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-ink-faint">
              {members.length === 0
                ? 'Todavía no hay socios cargados. Usá “Alta de socio” para empezar.'
                : 'No se encontraron socios con esos criterios.'}
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {formAbierto && (
          <SocioFormModal
            socio={enEdicion}
            onGuardar={guardar}
            onCerrar={() => setFormAbierto(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
