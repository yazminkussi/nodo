import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNodoStore } from './store/useNodoStore';
import { useSesion } from './store/useSesion';
import SocioPortal from './components/SocioPortal';
import AdminDashboard from './components/AdminDashboard';
import LoginScreen from './components/auth/LoginScreen';
import Toasts from './components/Toast';
import PwaUpdateBanner from './components/PwaUpdateBanner';
import { useComunidadRealtime, useAccesoRealtime } from './hooks/useComunidadRealtime';

export default function App() {
  const role = useNodoStore((s) => s.role);
  const estado = useSesion((s) => s.estado);
  const init = useSesion((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Sincronización en vivo de la marca (logo + nombre) y del historial de
  // acceso entre todos los dispositivos y PWAs instaladas (Supabase Realtime).
  useComunidadRealtime();
  useAccesoRealtime();

  if (estado === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nodo-navy">
        <Loader2 className="animate-spin text-nodo-cyan" size={28} />
      </div>
    );
  }

  if (estado === 'anonimo') {
    return (
      <>
        <Toasts />
        <LoginScreen />
      </>
    );
  }

  // 'activo' o 'demo' → app completa
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
