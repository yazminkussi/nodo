import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const estilos = {
  sun: 'bg-sun text-ink hover:brightness-[0.97]',
  lav: 'bg-lav text-cream hover:bg-lav-deep',
  ink: 'bg-ink text-cream hover:brightness-125',
  ghost: 'bg-transparent text-ink ring-1 ring-inset ring-line hover:bg-sand',
  danger: 'bg-crit text-cream hover:brightness-95',
};

const tamanos = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-sm gap-2',
};

export default function Button({
  children,
  variant = 'lav',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition disabled:opacity-60 ${estilos[variant]} ${tamanos[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
}
