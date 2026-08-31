import { motion } from 'framer-motion';

/* Marca de NODO: un nudo de trazo continuo.
   `draw` dibuja el trazo al montar vía framer-motion (respeta la preferencia
   de reducir movimiento por el MotionConfig de main.jsx) y siempre termina en
   el nudo completo. */

const PATH = 'M7 9c0-3 3-5 6-5s6 2 6 5-3 5-6 5-6 2-6 5 3 5 6 5 6-2 6-5';

export default function Knot({
  size = 24,
  color = 'currentColor',
  stroke = 2.4,
  draw = false,
  className = '',
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {draw ? (
        <motion.path
          d={PATH}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      ) : (
        <path d={PATH} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      )}
    </svg>
  );
}
