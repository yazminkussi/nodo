import { motion } from 'framer-motion';
import { ShieldCheck, Trophy, Palette } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { ROLES_ADMIN } from '../data/mockData';

const iconos = {
  shield: ShieldCheck,
  trophy: Trophy,
  palette: Palette,
};

const roles = Object.values(ROLES_ADMIN);

export default function AdminRoleSwitcher() {
  const adminRole = useNodoStore((s) => s.adminRole);
  const setAdminRole = useNodoStore((s) => s.setAdminRole);
  const addToast = useNodoStore((s) => s.addToast);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        Rol de administración activo
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {roles.map((r) => {
          const activo = r.id === adminRole;
          const Icon = iconos[r.icono] || ShieldCheck;
          return (
            <button
              key={r.id}
              onClick={() => {
                setAdminRole(r.id);
                addToast(`Rol cambiado a ${r.etiqueta}.`, 'info');
              }}
              className={`relative flex items-start gap-2.5 rounded-xl p-3 text-left transition-colors ${
                activo
                  ? 'bg-nodo-navy text-white shadow-card'
                  : 'bg-nodo-surface text-slate-600 ring-1 ring-inset ring-nodo-border hover:bg-slate-100'
              }`}
            >
              {activo && (
                <motion.span
                  layoutId="admin-role-pill"
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activo ? 'bg-nodo-cyan/20 text-nodo-cyan' : 'bg-white text-nodo-teal'}`}>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="relative min-w-0">
                <span className="block text-sm font-extrabold leading-tight">{r.etiqueta}</span>
                <span className={`mt-0.5 block text-[11px] font-semibold leading-snug ${activo ? 'text-slate-300' : 'text-slate-500'}`}>
                  {r.descripcion}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
