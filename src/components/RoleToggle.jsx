import { motion } from 'framer-motion';
import { UserRound, LayoutDashboard } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';

const opciones = [
  { key: 'socio', label: 'Vista Socio', icon: UserRound },
  { key: 'admin', label: 'Vista Administración', icon: LayoutDashboard },
];

export default function RoleToggle() {
  const role = useNodoStore((s) => s.role);
  const setRole = useNodoStore((s) => s.setRole);

  return (
    <div
      className="relative inline-flex items-center gap-1 rounded-full bg-white/10 p-1"
      role="tablist"
      aria-label="Cambiar de vista"
    >
      {opciones.map(({ key, label, icon: Icon }) => {
        const activo = role === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={activo}
            onClick={() => setRole(key)}
            className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
              activo ? 'text-ink' : 'text-cream/60 hover:text-cream'
            }`}
          >
            {activo && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 -z-10 rounded-full bg-sun"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={16} strokeWidth={2.2} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{key === 'socio' ? 'Socio' : 'Admin'}</span>
          </button>
        );
      })}
    </div>
  );
}
