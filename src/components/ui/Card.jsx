import { motion } from 'framer-motion';

/* Tarjeta base. `hover` agrega la elevación al pasar el mouse. */
export default function Card({ hover = false, className = '', children, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`rounded-2xl border border-line bg-cloud shadow-card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
