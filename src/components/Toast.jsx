import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';

const config = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-200', text: 'text-nodo-green-dark' },
  error: { icon: AlertTriangle, ring: 'ring-red-200', text: 'text-nodo-red' },
  info: { icon: Info, ring: 'ring-cyan-200', text: 'text-nodo-teal' },
};

export default function Toasts() {
  const toasts = useNodoStore((s) => s.toasts);
  const removeToast = useNodoStore((s) => s.removeToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const { icon: Icon, ring, text } = config[t.tipo] || config.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lift ring-1 ${ring}`}
            >
              <Icon size={18} className={text} strokeWidth={2.2} />
              <span>{t.mensaje}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-1 text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
