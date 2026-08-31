import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarCheck, CheckCircle2, Download, UserRound, CalendarX2 } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion } from '../store/useSesion';
import { useReservasData } from '../hooks/useReservasData';
import {
  nextDays,
  todayISO,
  formatARS,
  formatFechaLarga,
  slotsDeHorario,
  diaActivo,
  nombreDias,
  horaAmin,
  minAstring,
} from '../data/mockData';
import { QrSvg } from '../utils/qr';
import SpaceIcon from './SpaceIcon';
import { StatusBadge } from './StatusBadge';

export default function BookingModal({ espacio, onClose }) {
  const socioDemo = useNodoStore((s) => s.members.find((m) => m.id === s.socioActualId));
  const miSocio = useSesion((s) => s.miSocio);
  const estado = useSesion((s) => s.estado);
  const socio = estado === 'activo' ? miSocio : socioDemo;
  const { isSlotTaken, addReservation } = useReservasData();
  const addToast = useNodoStore((s) => s.addToast);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const dias = nextDays(7);
  const hoy = todayISO();
  const [fecha, setFecha] = useState(dias[0]);
  const [inicio, setInicio] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const diaCerrado = !diaActivo(espacio.horario.dias, fecha);
  const slots = useMemo(
    () => (diaCerrado ? [] : slotsDeHorario(espacio.horario)),
    [espacio, diaCerrado]
  );

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setInicio(null);
  }, [fecha, espacio.id]);

  const horaActual = new Date().getHours();
  const slotDeshabilitado = (slot) => {
    if (fecha === hoy && Number(slot.split(':')[0]) <= horaActual) return true;
    return isSlotTaken(espacio.id, fecha, slot);
  };

  const confirmar = async () => {
    if (!inicio || !socio) return;
    setError('');
    setGuardando(true);
    try {
      const reserva = await addReservation({
        espacioId: espacio.id,
        socioId: estado === 'activo' ? socio.id : undefined,
        socioNombre: `${socio.nombre} ${socio.apellido}`,
        fecha,
        inicio,
        duracion: espacio.horario.duracionTurno,
      });
      setConfirmado(reserva);
      addToast('Reserva confirmada. Te esperamos en el club.', 'success');
    } catch (e) {
      setError(e?.message || 'No se pudo confirmar la reserva.');
    } finally {
      setGuardando(false);
    }
  };

  const finReserva = (ini) => minAstring(horaAmin(ini) + espacio.horario.duracionTurno * 60);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: espacio.color }}
              >
                <SpaceIcon icono={espacio.icono} />
              </div>
              <div>
                <h3 className="font-extrabold text-ink">
                  {confirmado ? 'Reserva confirmada' : `Reservar · ${espacio.nombre}`}
                </h3>
                <p className="text-xs text-ink-soft">
                  {formatARS(espacio.precioHora)} / hora · {espacio.capacidad} personas
                </p>
                <p className="text-[11px] font-bold text-lav">
                  {nombreDias(espacio.horario.dias)} · {espacio.horario.apertura} a{' '}
                  {espacio.horario.cierre}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-ink-faint transition hover:bg-sand hover:text-ink-soft"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {confirmado ? (
            <div className="p-5">
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-nodo-teal/50 bg-gradient-to-br from-cyan-50 to-emerald-50 p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lav-deep/20 blur-2xl" />
                <div className="relative flex items-center gap-2 text-ok">
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                  <p className="text-sm font-extrabold">Pase de ingreso digital</p>
                  <StatusBadge estado="confirmada" className="ml-auto" />
                </div>
                <div className="relative mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="shrink-0 rounded-xl bg-white p-2 shadow-card">
                    <QrSvg
                      value={`NODO|RESERVA|${confirmado.id}|${espacio.id}|${fecha}|${inicio}`}
                      size={120}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-ink">
                      <UserRound size={14} className="text-lav" />
                      <span className="font-bold">
                        {socio.nombre} {socio.apellido}
                      </span>
                    </p>
                    <p className="text-ink-soft">
                      <span className="font-semibold text-ink-soft">Espacio:</span> {espacio.nombre}
                    </p>
                    <p className="text-ink-soft">
                      <span className="font-semibold text-ink-soft">Fecha:</span>{' '}
                      {formatFechaLarga(fecha)}
                    </p>
                    <p className="text-ink-soft">
                      <span className="font-semibold text-ink-soft">Horario:</span> {inicio} a{' '}
                      {finReserva(inicio)} hs
                    </p>
                    <p className="text-xs text-ink-faint">
                      Mostrá este pase en la entrada del espacio para ingresar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => addToast('Pase guardado en tu carnet digital.', 'info')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lav-deep px-4 py-3 text-sm font-bold text-white transition hover:bg-lav-deep"
                >
                  <Download size={16} /> Guardar pase
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-sand px-4 py-3 text-sm font-bold text-ink-soft transition hover:bg-slate-200"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">
                Elegí el día
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dias.map((d) => {
                  const [, m, dd] = d.split('-');
                  const activo = d === fecha;
                  const esHoy = d === hoy;
                  const cerrado = !diaActivo(espacio.horario.dias, d);
                  const diaSemana = new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', {
                    weekday: 'short',
                  });
                  return (
                    <button
                      key={d}
                      onClick={() => setFecha(d)}
                      className={`flex min-w-[64px] flex-col items-center rounded-xl px-3 py-2 transition-colors ${
                        activo
                          ? 'bg-lav-deep text-white shadow-card'
                          : 'bg-paper text-ink-soft ring-1 ring-inset ring-line hover:bg-sand'
                      } ${cerrado && !activo ? 'opacity-45' : ''}`}
                    >
                      <span className="text-[10px] font-semibold uppercase">{diaSemana}</span>
                      <span className="text-lg font-extrabold leading-none">{dd}</span>
                      <span className="text-[10px] font-semibold uppercase">{m}</span>
                      {esHoy && <span className="text-[9px] font-bold text-lav">Hoy</span>}
                      {cerrado && (
                        <span className="text-[8px] font-bold text-ink-faint">Cerrado</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-ink-faint">
                Elegí el horario
              </p>
              {diaCerrado ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-8 text-center">
                  <CalendarX2 size={26} className="text-slate-300" />
                  <p className="text-sm font-bold text-ink-soft">Este espacio no abre ese día</p>
                  <p className="text-xs text-ink-faint">
                    {nombreDias(espacio.horario.dias)} · {espacio.horario.apertura} a{' '}
                    {espacio.horario.cierre}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const ocupado = slotDeshabilitado(slot);
                    const activo = inicio === slot;
                    return (
                      <button
                        key={slot}
                        disabled={ocupado}
                        onClick={() => setInicio(slot)}
                        className={`rounded-lg px-2 py-2 text-sm font-bold transition-colors ${
                          activo
                            ? 'bg-lav text-cream shadow-card'
                            : ocupado
                              ? 'cursor-not-allowed bg-sand text-ink-faint line-through'
                              : 'bg-lav-soft text-lav-deep ring-1 ring-inset ring-lav/25 hover:bg-lav hover:text-cream'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
                  {error}
                </p>
              )}
              {!socio && (
                <p className="mt-3 rounded-lg bg-sun-soft px-3 py-2 text-xs font-semibold text-[#97621b]">
                  Necesitás una ficha de socio vinculada para reservar.
                </p>
              )}

              <button
                disabled={!inicio || guardando || !socio}
                onClick={confirmar}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-lav-deep px-4 py-3.5 text-sm font-extrabold text-cream shadow-card transition hover:bg-lav disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarCheck size={17} />
                {guardando
                  ? 'Confirmando…'
                  : inicio
                    ? `Confirmar reserva · ${inicio} hs`
                    : 'Seleccioná un horario'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
