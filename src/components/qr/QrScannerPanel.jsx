import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Loader2,
  Flashlight,
  FlipHorizontal,
  Keyboard,
  ShieldCheck,
  ScanLine,
  AlertCircle,
} from 'lucide-react';
import { useQrScanner } from '../../hooks/useQrScanner';

export default function QrScannerPanel({ onEscaneado, onIngresoManual, pausado = false }) {
  const scanner = useQrScanner('nodo-lector-qr');
  const {
    estado,
    error,
    camaraFrontal,
    linternaDisponible,
    linternaEncendida,
    nCamaras,
    iniciar,
    detener,
    alternarCamara,
    alternarLinterna,
    pausar,
    reanudar,
  } = scanner;

  useEffect(() => {
    if (pausado) pausar();
    else reanudar();
  }, [pausado, pausar, reanudar]);

  const esActivo = estado === 'escaneando' || estado === 'iniciando';

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lav-deep text-white">
            <ScanLine size={17} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-ink">Escanear QR</h3>
            <p className="text-[11px] font-semibold text-ink-faint">
              Apuntá al carnet digital del socio para validar su ingreso
            </p>
          </div>
        </div>
        {esActivo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-xs font-extrabold text-ok ring-1 ring-inset ring-emerald-200">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="h-1.5 w-1.5 rounded-full bg-nodo-green"
            />
            Listo para escanear
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-dashed border-line bg-nodo-bg">
          <div id="nodo-lector-qr" className="relative min-h-[300px] w-full" />

          <AnimatePresence>
            {estado === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lav-deep text-white shadow-card">
                  <Camera size={28} />
                </div>
                <div>
                  <p className="font-extrabold text-ink">Cámara lista para iniciar</p>
                  <p className="text-xs text-ink-soft">
                    {nCamaras > 0
                      ? `${nCamaras} cámaras detectadas en el dispositivo.`
                      : 'El navegador pedirá permiso para acceder a la cámara.'}
                  </p>
                </div>
                <button
                  onClick={() => iniciar(onEscaneado, 'environment')}
                  className="inline-flex items-center gap-2 rounded-xl bg-nodo-green px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-green-dark"
                >
                  <Camera size={16} /> Iniciar escáner
                </button>
              </motion.div>
            )}

            {estado === 'iniciando' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <Loader2 size={30} className="animate-spin text-lav" />
                <p className="text-sm font-bold text-ink-soft">Activando cámara…</p>
              </motion.div>
            )}

            {estado === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <AlertCircle size={34} className="text-crit" />
                <div>
                  <p className="font-extrabold text-ink">No se pudo acceder a la cámara</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{error}</p>
                </div>
                <button
                  onClick={() => iniciar(onEscaneado, camaraFrontal ? 'user' : 'environment')}
                  className="inline-flex items-center gap-2 rounded-xl bg-lav-deep px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-lav-deep"
                >
                  <CameraOff size={16} /> Reintentar
                </button>
              </motion.div>
            )}

            {estado === 'detenido' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <CameraOff size={30} className="text-ink-faint" />
                <p className="text-sm font-bold text-ink-soft">Escáner detenido</p>
                <button
                  onClick={() => iniciar(onEscaneado, 'environment')}
                  className="inline-flex items-center gap-2 rounded-xl bg-lav-deep px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-lav-deep"
                >
                  <Camera size={16} /> Volver a escanear
                </button>
              </motion.div>
            )}

            {pausado && esActivo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-nodo-navy/70 p-6 text-center backdrop-blur-sm"
              >
                <ShieldCheck size={32} className="text-white" />
                <p className="text-sm font-extrabold text-white">Analizando resultado…</p>
                <p className="text-xs text-white/70">Escaneo pausado temporalmente</p>
              </motion.div>
            )}

            {esActivo && !pausado && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  className="h-44 w-44 rounded-2xl border-2 border-nodo-green/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]"
                >
                  <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-nodo-green/70 shadow-glow" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {esActivo && (
          <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-2">
            <button
              onClick={detener}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sand px-3.5 py-2.5 text-xs font-bold text-ink-soft transition hover:bg-slate-200"
            >
              <CameraOff size={14} /> Detener
            </button>
            {nCamaras > 1 && (
              <button
                onClick={alternarCamara}
                title="Cambiar de cámara"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sand px-3.5 py-2.5 text-xs font-bold text-ink-soft transition hover:bg-slate-200"
              >
                <FlipHorizontal size={14} /> {camaraFrontal ? 'Trasera' : 'Frontal'}
              </button>
            )}
            {linternaDisponible && (
              <button
                onClick={alternarLinterna}
                title={linternaEncendida ? 'Apagar linterna' : 'Encender linterna'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  linternaEncendida
                    ? 'bg-nodo-amber text-amber-950 shadow-card'
                    : 'bg-sand text-ink-soft hover:bg-slate-200'
                }`}
              >
                <Flashlight size={14} /> {linternaEncendida ? 'Encendida' : 'Linterna'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line bg-paper/50 p-4 sm:p-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-ink-faint">
          <Keyboard size={13} /> Ingreso manual por DNI / Nº de Socio
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onIngresoManual(e.target.elements.consulta.value);
            e.target.elements.consulta.value = '';
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            name="consulta"
            type="text"
            inputMode="search"
            required
            placeholder="Ej: 33774155 o 0198"
            className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-ink shadow-card ring-1 ring-line placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lav-deep px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-lav-deep"
          >
            <ShieldCheck size={16} /> Verificar
          </button>
        </form>
        <p className="mt-2 text-[11px] text-ink-faint">
          Si la cámara no está disponible, buscá al socio por DNI o por su número de socio.
        </p>
      </div>
    </section>
  );
}
