import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserRound,
  CalendarClock,
  BadgeCheck,
  Wallet,
  X,
  ArrowRight,
} from 'lucide-react';
import { formatARS } from '../../data/mockData';

const iniciales = (a, b) => `${String(a || '?').charAt(0)}${String(b || '?').charAt(0)}`.toUpperCase();

export default function AccessResultModal({
  resultado,
  onClose,
  onRegistrarPago,
  onOverride,
}) {
  if (!resultado) return null;

  const esPermitido = resultado.tipo === 'permitido';
  const esDenegado = resultado.tipo === 'denegado';
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-nodo-navy/70 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Resultado del control de acceso"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl shadow-lift ${
            esPermitido
              ? 'bg-gradient-to-br from-emerald-600 to-nodo-green-dark'
              : esDenegado
                ? 'bg-gradient-to-br from-red-600 to-rose-700'
                : 'bg-gradient-to-br from-slate-800 to-nodo-navy'
          }`}
        >
          {esPermitido && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
              className="m-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15"
            >
              <CheckCircle2 size={52} className="text-white" strokeWidth={2.4} />
            </motion.div>
          )}
          {esDenegado && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
              className="m-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15"
            >
              <XCircle size={52} className="text-white" strokeWidth={2.4} />
            </motion.div>
          )}

          <div className="px-6 pb-6 text-center text-white">
            <p className="text-3xl font-extrabold tracking-tight">
              {esPermitido ? 'Acceso Permitido' : esDenegado ? 'Acceso Denegado' : 'Código Inválido'}
            </p>
            <p className="mt-1 text-sm font-semibold text-white/80">
              {esPermitido
                ? 'El socio está al día. Podés dejarlo ingresar.'
                : esDenegado
                  ? 'El socio adeuda su cuota. Rompé el acceso sugerido solo si corresponde.'
                  : resultado.motivo}
            </p>

            {resultado.comunidadIncorrecta && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-nodo-amber/90 px-3 py-1 text-xs font-extrabold text-amber-950">
                <AlertTriangle size={13} /> QR de otra institución
              </span>
            )}

            {resultado.comunidadNombre && (
              <p className="mt-2 text-xs text-white/70">
                Institución del QR: <span className="font-bold text-white">{resultado.comunidadNombre}</span>
              </p>
            )}
          </div>

          {(esPermitido || esDenegado) && resultado.socio && (
            <div className="mx-5 mb-5 rounded-2xl bg-white/95 p-4 text-slate-700 shadow-card">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ background: resultado.socio.color || '#0F172A' }}
                >
                  {iniciales(resultado.socio.nombre, resultado.socio.apellido)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-nodo-navy">
                    {resultado.socio.nombre} {resultado.socio.apellido}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Socio N° <span className="font-mono font-bold">{resultado.socio.numero}</span> ·{' '}
                    {resultado.socio.categoria}
                  </p>
                </div>
                <span
                  className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${
                    esPermitido
                      ? 'bg-emerald-50 text-nodo-green-dark ring-emerald-200'
                      : 'bg-red-50 text-nodo-red ring-red-200'
                  }`}
                >
                  <BadgeCheck size={13} />
                  {esPermitido ? 'Al día' : 'Adeuda'}
                </span>
              </div>

              {esDenegado && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-inset ring-red-100">
                  <div className="flex items-center gap-2 text-nodo-red">
                    <Wallet size={16} />
                    <p className="text-sm font-extrabold">
                      Cuota adeudada · {resultado.meses} {resultado.meses === 1 ? 'mes' : 'meses'}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Debe abonar <span className="font-extrabold text-nodo-red">{formatARS(resultado.monto)}</span>{' '}
                    (cuota mensual). Último pago: {resultado.socio.ultimaCuota}.
                  </p>
                </div>
              )}

              {esPermitido && resultado.reserva ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-cyan-50 p-3 ring-1 ring-inset ring-cyan-100">
                  <CalendarClock size={17} className="shrink-0 text-nodo-teal" />
                  <div className="text-xs">
                    <p className="font-bold text-nodo-teal">Reserva activa hoy</p>
                    <p className="text-slate-600">
                      {resultado.reserva.espacioNombre} · {resultado.reserva.hora} hs
                    </p>
                  </div>
                </div>
              ) : (
                esPermitido && (
                  <p className="mt-3 text-center text-xs font-semibold text-slate-400">
                    Sin reservas activas para hoy.
                  </p>
                )
              )}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <UserRound size={12} /> Verificado por {resultado.escaneadoPor} · {hora} hs ·{' '}
                {resultado.metodo === 'manual' ? 'ingreso manual' : 'QR'}
              </p>
            </div>
          )}

          <div className="space-y-2 px-5 pb-6">
            {esPermitido && (
              <button
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-nodo-green-dark shadow-card transition hover:bg-emerald-50"
              >
                Ingreso registrado <ArrowRight size={16} />
              </button>
            )}

            {esDenegado && (
              <>
                <button
                  onClick={() => onRegistrarPago(resultado.socio)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-nodo-red shadow-card transition hover:bg-red-50"
                >
                  <CheckCircle2 size={17} /> Registrar pago ahora
                </button>
                <button
                  onClick={() => onOverride(resultado.socio)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/20"
                >
                  Permitir ingreso de todos modos
                </button>
              </>
            )}

            {!(esPermitido || esDenegado) && (
              <button
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-slate-700 shadow-card transition hover:bg-slate-50"
              >
                Entendido <ArrowRight size={16} />
              </button>
            )}

            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={15} /> Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}