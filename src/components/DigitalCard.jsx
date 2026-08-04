import { motion } from 'framer-motion';
import { BadgeCheck, CalendarClock, ScanLine, Sparkles } from 'lucide-react';
import { useNodoStore, useProximaReserva } from '../store/useNodoStore';
import { StatusBadge } from './StatusBadge';
import { QrSvg } from '../utils/qr';
import { formatFechaLarga } from '../data/mockData';
import NodoLogo from './Navbar';

const iniciales = (nombre, apellido) =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

export default function DigitalCard() {
  const socio = useNodoStore((s) => s.members.find((m) => m.id === s.socioActualId));
  const proxima = useProximaReserva(socio?.id);

  if (!socio) return null;

  const qrPayload = `NODO|${socio.numero}|${socio.nombre} ${socio.apellido}|${socio.categoria}|${socio.cuotaAlDia ? 'AL_DIA' : 'MOROSO'}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl px-4 sm:px-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">Carnet Digital</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-nodo-teal ring-1 ring-inset ring-cyan-200">
          <Sparkles size={13} /> Ingreso sin contacto
        </span>
      </div>

      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nodo-navy via-nodo-navy-2 to-[#0B1222] p-5 text-white shadow-lift ring-1 ring-white/10 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-nodo-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-nodo-teal/20 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Club Social y Deportivo La Unión
            </p>
            <p className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Carnet Digital</p>
          </div>
          <NodoLogo className="h-9 w-9 opacity-90" />
        </div>

        <div className="relative mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white ring-4 ring-white/10"
                style={{ background: socio.color }}
              >
                {iniciales(socio.nombre, socio.apellido)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold sm:text-xl">
                  {socio.nombre} {socio.apellido}
                </p>
                <p className="text-sm text-slate-300">
                  Socio N° <span className="font-mono font-bold text-white">{socio.numero}</span>
                </p>
                <p className="text-xs text-slate-400">{socio.categoria} · {socio.localidad}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge estado={socio.cuotaAlDia ? 'alDia' : 'moroso'} />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ring-white/20">
                <BadgeCheck size={13} className="text-nodo-cyan" /> {socio.categoria}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ring-white/20">
                <CalendarClock size={13} className="text-nodo-green" /> Válido hasta {formatFechaLarga('2026-08-31')}
              </span>
            </div>

            {proxima && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-nodo-cyan/40 bg-nodo-cyan/10 px-4 py-2.5">
                <div className="text-xs">
                  <p className="font-bold text-nodo-cyan">Próxima reserva</p>
                  <p className="text-slate-300">
                    {proxima.espacio?.nombre} · {proxima.inicio} hs
                  </p>
                </div>
                <ScanLine size={18} className="text-nodo-cyan" />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="rounded-xl bg-white p-3">
              <QrSvg value={qrPayload} size={128} className="block" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Mostrar al ingresar
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
