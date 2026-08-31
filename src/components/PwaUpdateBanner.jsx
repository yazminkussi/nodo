import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, RefreshCw, Sparkles } from 'lucide-react';
import { usePwaUpdate } from '../hooks/usePwaUpdate';

export default function PwaUpdateBanner() {
  const { actualizacionDisponible, instalando, aplicarActualizacion } = usePwaUpdate();

  return (
    <AnimatePresence>
      {actualizacionDisponible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-md"
          role="dialog"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-nodo-navy p-4 text-white shadow-lift ring-1 ring-white/10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nodo-cyan to-nodo-teal">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">¡Hay una versión nueva!</p>
              <p className="text-xs text-slate-300">
                Marca y funciones actualizadas. Aplicá los cambios para seguir al día.
              </p>
            </div>
            <button
              onClick={aplicarActualizacion}
              disabled={instalando}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-nodo-green px-3.5 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-nodo-green-dark disabled:opacity-60"
            >
              {instalando ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RotateCw size={14} />
              )}
              Actualizar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
