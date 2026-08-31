import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CalendarDays, UserRound, Filter, CalendarX2 } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useReservasData } from '../hooks/useReservasData';
import { useSocios } from '../hooks/useSocios';
import {
  nextDays,
  todayISO,
  formatFechaLarga,
  ROLES_ADMIN,
  slotsDeHorario,
  diaActivo,
} from '../data/mockData';
import SpaceIcon from './SpaceIcon';
import { StatusBadge } from './StatusBadge';

const mismoId = (a, b) => String(a) === String(b);

export default function ReservationManager() {
  const {
    espacios,
    reservas: reservations,
    cancelReservation,
    addReservation,
    isSlotTaken,
  } = useReservasData();
  const { socios: members } = useSocios();
  const addToast = useNodoStore((s) => s.addToast);
  const adminRole = useNodoStore((s) => s.adminRole);

  const categoriasPermitidas = ROLES_ADMIN[adminRole]?.categorias;
  const espaciosVisibles = categoriasPermitidas
    ? espacios.filter((e) => categoriasPermitidas.includes(e.categoria))
    : espacios;

  const dias = nextDays(7);
  const hoy = todayISO();
  const [dia, setDia] = useState(hoy);
  const [seleccion, setSeleccion] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ socioId: '', espacioId: '', inicio: '' });

  const slotsDelDia = useMemo(() => {
    const set = new Set();
    espaciosVisibles.forEach((e) => {
      if (!diaActivo(e.horario.dias, dia)) return;
      slotsDeHorario(e.horario).forEach((s) => set.add(s));
    });
    return [...set].sort();
  }, [espaciosVisibles, dia]);

  const esSlotDe = (esp, slot) =>
    diaActivo(esp.horario.dias, dia) && slotsDeHorario(esp.horario).includes(slot);

  const reservasDelDia = useMemo(
    () => reservations.filter((r) => r.fecha === dia),
    [reservations, dia]
  );

  const reservaDeCelda = (espacioId, inicio) =>
    reservasDelDia.find((r) => r.espacioId === espacioId && r.inicio === inicio);

  const espacioForm = espacios.find((e) => mismoId(e.id, form.espacioId));
  const slotsForm =
    espacioForm && diaActivo(espacioForm.horario.dias, dia)
      ? slotsDeHorario(espacioForm.horario)
      : [];

  const crearReserva = async () => {
    const socio = members.find((m) => mismoId(m.id, form.socioId));
    if (!socio || !form.espacioId || !form.inicio) {
      addToast('Completá socio, espacio y horario.', 'error');
      return;
    }
    if (isSlotTaken(espacioForm.id, dia, form.inicio)) {
      addToast('Ese horario ya está reservado. Elegí otro turno.', 'error');
      return;
    }
    try {
      await addReservation({
        espacioId: espacioForm.id,
        socioId: socio.id,
        socioNombre: `${socio.nombre} ${socio.apellido}`,
        fecha: dia,
        inicio: form.inicio,
        duracion: espacioForm.horario.duracionTurno,
      });
      addToast(`Reserva creada para ${socio.nombre} ${socio.apellido}.`, 'success');
      setFormOpen(false);
      setForm({ socioId: '', espacioId: '', inicio: '' });
    } catch (e) {
      addToast(e?.message || 'No se pudo crear la reserva.', 'error');
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">Control de Reservas</h2>
          <p className="text-xs text-ink-soft">
            Grilla sincronizada con los horarios configurados por espacio.
            {categoriasPermitidas && (
              <span className="ml-1 inline-flex items-center gap-1 font-bold text-lav">
                <Filter size={11} /> Solo {categoriasPermitidas.join(' y ')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-lav-deep px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-lav"
        >
          <Plus size={16} /> Nueva reserva
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {dias.map((d) => {
          const activo = d === dia;
          const esHoy = d === hoy;
          const diaSemana = new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', {
            weekday: 'short',
          });
          const [m, dd] = [d.split('-')[1], d.split('-')[2]];
          return (
            <button
              key={d}
              onClick={() => {
                setDia(d);
                setSeleccion(null);
              }}
              className={`flex min-w-[64px] flex-col items-center rounded-xl px-3 py-2 transition-colors ${
                activo
                  ? 'bg-lav-deep text-white shadow-card'
                  : 'border border-line bg-cloud text-ink-soft hover:bg-paper'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase">{diaSemana}</span>
              <span className="text-lg font-extrabold leading-none">{dd}</span>
              <span className="text-[10px] font-semibold uppercase">{m}</span>
              {esHoy && <span className="text-[9px] font-bold text-lav">Hoy</span>}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-cloud shadow-card">
        <div className="flex items-center gap-4 border-b border-line bg-paper px-4 py-2.5">
          <span className="text-xs font-bold text-ink-soft">{formatFechaLarga(dia)}</span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-sm bg-lav-deep" /> Reservado
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-sm bg-paper ring-1 ring-line" /> Libre
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint">
            <span className="h-2.5 w-2.5 rounded-sm bg-paper" /> Cerrado
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-44 border-b border-r border-line bg-cloud px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-ink-soft">
                  Espacio
                </th>
                {slotsDelDia.map((h) => (
                  <th
                    key={h}
                    className="border-b border-line bg-cloud px-1 py-2.5 text-center text-[10px] font-bold text-ink-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {espaciosVisibles.map((esp) => (
                <tr key={esp.id}>
                  <td className="sticky left-0 z-10 border-b border-r border-line bg-cloud px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: esp.color }}
                      >
                        <SpaceIcon icono={esp.icono} className="h-3.5 w-3.5" />
                      </div>
                      <span className="whitespace-nowrap text-[11px] font-bold text-ink">
                        {esp.nombre}
                      </span>
                    </div>
                  </td>
                  {slotsDelDia.map((h) => {
                    if (!esSlotDe(esp, h)) {
                      return (
                        <td key={h} className="border-b border-line p-0.5">
                          <span className="flex h-8 w-full items-center justify-center rounded-md bg-paper text-slate-300">
                            <CalendarX2 size={11} />
                          </span>
                        </td>
                      );
                    }
                    const reserva = reservaDeCelda(esp.id, h);
                    const esHoyPasado =
                      dia === hoy && Number(h.split(':')[0]) <= new Date().getHours();
                    return (
                      <td key={h} className="border-b border-line p-0.5">
                        <button
                          disabled={!reserva}
                          onClick={() => reserva && setSeleccion(reserva)}
                          className={`h-8 w-full rounded-md text-[9px] font-bold transition ${
                            reserva
                              ? 'bg-lav-deep text-white shadow-sm hover:bg-lav'
                              : esHoyPasado
                                ? 'bg-paper text-slate-300'
                                : 'bg-paper ring-1 ring-inset ring-line/60 hover:bg-lav-soft'
                          }`}
                          title={reserva ? `${reserva.socioNombre} · ${h} hs` : h}
                        >
                          {reserva ? reserva.socioNombre.split(' ')[0] : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {seleccion && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-soft text-lav">
                <UserRound size={18} />
              </div>
              <div>
                <p className="font-extrabold text-ink">{seleccion.socioNombre}</p>
                <p className="text-xs text-ink-soft">
                  {espacios.find((e) => mismoId(e.id, seleccion.espacioId))?.nombre} ·{' '}
                  {seleccion.inicio} hs
                </p>
              </div>
            </div>
            <StatusBadge estado="confirmada" className="sm:ml-2" />
            <button
              onClick={async () => {
                try {
                  await cancelReservation(seleccion.id);
                  addToast('Reserva cancelada.', 'info');
                } catch {
                  addToast('No se pudo cancelar la reserva.', 'error');
                }
                setSeleccion(null);
              }}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-crit-soft px-4 py-2 text-xs font-bold text-crit transition hover:brightness-95"
            >
              <Trash2 size={14} /> Cancelar reserva
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setFormOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-3xl"
            >
              <h3 className="mb-4 flex items-center gap-2 font-extrabold text-ink">
                <CalendarDays size={18} className="text-lav" /> Nueva reserva ·{' '}
                {formatFechaLarga(dia)}
              </h3>
              <label className="mb-1 block text-xs font-bold text-ink-soft">Socio</label>
              <select
                value={form.socioId}
                onChange={(e) => setForm({ ...form, socioId: e.target.value })}
                className="mb-3 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-lav"
              >
                <option value="">Seleccionar socio…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.apellido} · N° {m.numero}
                  </option>
                ))}
              </select>
              <label className="mb-1 block text-xs font-bold text-ink-soft">Espacio</label>
              <select
                value={form.espacioId}
                onChange={(e) => setForm({ ...form, espacioId: e.target.value, inicio: '' })}
                className="mb-3 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-lav"
              >
                <option value="">Seleccionar espacio…</option>
                {espaciosVisibles.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
              <label className="mb-1 block text-xs font-bold text-ink-soft">Horario</label>
              {espacioForm && !diaActivo(espacioForm.horario.dias, dia) ? (
                <p className="mb-4 rounded-xl bg-paper px-3 py-2.5 text-xs font-bold text-ink-faint">
                  Este espacio no abre ese día. Elegí otro espacio o fecha.
                </p>
              ) : (
                <div className="mb-4 grid grid-cols-6 gap-2">
                  {slotsForm.map((h) => {
                    const ocupado = espacioForm && isSlotTaken(espacioForm.id, dia, h);
                    const activo = form.inicio === h;
                    return (
                      <button
                        key={h}
                        disabled={ocupado}
                        onClick={() => setForm({ ...form, inicio: h })}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                          activo
                            ? 'bg-lav-deep text-white'
                            : ocupado
                              ? 'cursor-not-allowed bg-sand text-slate-300 line-through'
                              : 'bg-lav-soft text-lav ring-1 ring-inset ring-lav/25 hover:bg-nodo-cyan hover:text-white'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={crearReserva}
                className="w-full rounded-xl bg-lav-deep px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-lav"
              >
                Crear reserva
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
