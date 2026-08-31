import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarCheck, CheckCircle2, Download, UserRound, CalendarX2 } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
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
  const socio = useNodoStore((s) => s.members.find((m) => m.id === s.socioActualId));
  const isSlotTaken = useNodoStore((s) => s.isSlotTaken);
  const addReservation = useNodoStore((s) => s.addReservation);
  const addToast = useNodoStore((s) => s.addToast);

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

  const confirmar = () => {
    if (!inicio) return;
    const reserva = addReservation({
      espacioId: espacio.id,
      socioId: socio.id,
      socioNombre: `${socio.nombre} ${socio.apellido}`,
      fecha,
      inicio,
      duracion: espacio.horario.duracionTurno,
    });
    setConfirmado(reserva);
    addToast('Reserva confirmada. Te esperamos en el club.', 'success');
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
          <div className="flex items-center justify-between border-b border-nodo-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: espacio.color }}
              >
                <SpaceIcon icono={espacio.icono} />
              </div>
              <div>
                <h3 className="font-extrabold text-nodo-navy">
                  {confirmado ? 'Reserva confirmada' : `Reservar · ${espacio.nombre}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatARS(espacio.precioHora)} / hora · {espacio.capacidad} personas
                </p>
                <p className="text-[11px] font-bold text-nodo-teal">
                  {nombreDias(espacio.horario.dias)} · {espacio.horario.apertura} a{' '}
                  {espacio.horario.cierre}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {confirmado ? (
            <div className="p-5">
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-nodo-teal/50 bg-gradient-to-br from-cyan-50 to-emerald-50 p-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-nodo-green/20 blur-2xl" />
                <div className="relative flex items-center gap-2 text-nodo-green-dark">
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
                    <p className="flex items-center gap-2 text-slate-700">
                      <UserRound size={14} className="text-nodo-teal" />
                      <span className="font-bold">
                        {socio.nombre} {socio.apellido}
                      </span>
                    </p>
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-500">Espacio:</span>{' '}
                      {espacio.nombre}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-500">Fecha:</span>{' '}
                      {formatFechaLarga(fecha)}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-semibold text-slate-500">Horario:</span> {inicio} a{' '}
                      {finReserva(inicio)} hs
                    </p>
                    <p className="text-xs text-slate-400">
                      Mostrá este pase en la entrada del espacio para ingresar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => addToast('Pase guardado en tu carnet digital.', 'info')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-bold text-white transition hover:bg-nodo-navy-2"
                >
                  <Download size={16} /> Guardar pase
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
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
                          ? 'bg-nodo-navy text-white shadow-card'
                          : 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-100'
                      } ${cerrado && !activo ? 'opacity-45' : ''}`}
                    >
                      <span className="text-[10px] font-semibold uppercase">{diaSemana}</span>
                      <span className="text-lg font-extrabold leading-none">{dd}</span>
                      <span className="text-[10px] font-semibold uppercase">{m}</span>
                      {esHoy && <span className="text-[9px] font-bold text-nodo-cyan">Hoy</span>}
                      {cerrado && (
                        <span className="text-[8px] font-bold text-slate-400">Cerrado</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Elegí el horario
              </p>
              {diaCerrado ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-nodo-border bg-nodo-surface px-4 py-8 text-center">
                  <CalendarX2 size={26} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">Este espacio no abre ese día</p>
                  <p className="text-xs text-slate-400">
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
                            ? 'bg-nodo-green text-white shadow-card'
                            : ocupado
                              ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                              : 'bg-cyan-50 text-nodo-teal ring-1 ring-inset ring-cyan-200 hover:bg-nodo-cyan hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                disabled={!inicio}
                onClick={confirmar}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-nodo-green px-4 py-3.5 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-green-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <CalendarCheck size={17} />
                {inicio ? `Confirmar reserva · ${inicio} hs` : 'Seleccioná un horario'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
