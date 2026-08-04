import { AnimatePresence, motion } from 'framer-motion';
import { useNodoStore } from './store/useNodoStore';
import SocioPortal from './components/SocioPortal';
import AdminDashboard from './components/AdminDashboard';
import Toasts from './components/Toast';

export default function App() {
  const role = useNodoStore((s) => s.role);

  return (
    <div className="min-h-screen bg-nodo-bg font-sans text-slate-800 antialiased">
      <Toasts />
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
