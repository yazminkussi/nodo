import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalPanel } from './motion';

/* Modal en hoja inferior (mobile) / centrado (desktop). */
export default function Modal({ title, icon: Icon, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        {...modalPanel}
        onClick={(e) => e.stopPropagation()}
        className={`w-full overflow-hidden rounded-t-3xl bg-cloud shadow-lift sm:rounded-3xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              {Icon && <Icon size={18} />}
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-ink-faint transition hover:bg-sand hover:text-ink"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="flex gap-2 border-t border-line p-4">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}
