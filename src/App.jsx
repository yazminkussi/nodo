import { lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNodoStore } from './store/useNodoStore';
import { useSesion } from './store/useSesion';
import LoginScreen from './components/auth/LoginScreen';
import Toasts from './components/Toast';
import PwaUpdateBanner from './components/PwaUpdateBanner';
import { useComunidadRealtime, useAccesoRealtime } from './hooks/useComunidadRealtime';

// El portal del socio y el panel de administración se cargan bajo demanda:
// un socio nunca descarga el panel admin (y viceversa).
const SocioPortal = lazy(() => import('./components/SocioPortal'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

function PantallaCarga({ oscura = false }) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center ${
        oscura ? 'bg-nodo-navy' : 'bg-nodo-bg'
      }`}
    >
      <Loader2 className="animate-spin text-nodo-cyan" size={28} />
    </div>
  );
}

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

  // El banner de actualización de la PWA registra el service worker y se muestra
  // en cualquier pantalla (incluido el login) cuando hay una versión nueva.
  const banner = <PwaUpdateBanner />;

  if (estado === 'cargando') {
    return (
      <>
        {banner}
        <PantallaCarga oscura />
      </>
    );
  }

  if (estado === 'anonimo') {
    return (
      <>
        {banner}
        <Toasts />
        <LoginScreen />
      </>
    );
  }

  // 'activo' o 'demo' → app completa
  return (
    <div className="min-h-screen bg-nodo-bg font-sans text-slate-800 antialiased">
      {banner}
      <Toasts />
      <Suspense fallback={<PantallaCarga />}>
        <motion.div
          key={role}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
        >
          {role === 'socio' ? <SocioPortal /> : <AdminDashboard />}
        </motion.div>
      </Suspense>
    </div>
  );
}
