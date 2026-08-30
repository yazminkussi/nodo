import { AnimatePresence, motion } from 'framer-motion';
import { useNodoStore } from './store/useNodoStore';
import SocioPortal from './components/SocioPortal';
import AdminDashboard from './components/AdminDashboard';
import Toasts from './components/Toast';
import PwaUpdateBanner from './components/PwaUpdateBanner';
import { useComunidadRealtime, useAccesoRealtime } from './hooks/useComunidadRealtime';

export default function App() {
  const role = useNodoStore((s) => s.role);

  // Sincronización en vivo de la marca (logo + nombre) y del historial de
  // acceso entre todos los dispositivos y PWAs instaladas (Supabase Realtime).
  useComunidadRealtime();
  useAccesoRealtime();

  return (
    <div className="min-h-screen bg-nodo-bg font-sans text-slate-800 antialiased">
      <Toasts />
      <PwaUpdateBanner />
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {role === 'socio' ? <SocioPortal /> : <AdminDashboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
