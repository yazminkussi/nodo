import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, CalendarRange, Store, Building2 } from 'lucide-react';
import { Header, SectionNav } from './Navbar';
import StatsOverview from './StatsOverview';
import MemberTable from './MemberTable';
import ReservationManager from './ReservationManager';
import AdsManager from './AdsManager';
import B2BOverview from './B2BOverview';
import { useNodoStore } from '../store/useNodoStore';

const secciones = [
  { key: 'resumen', label: 'Panel', icon: LayoutDashboard },
  { key: 'socios', label: 'Socios', icon: Users },
  { key: 'reservas', label: 'Reservas', icon: CalendarRange },
  { key: 'publicidades', label: 'Publicidades', icon: Store },
  { key: 'planes', label: 'Planes NODO', icon: Building2 },
];

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('resumen');
  const members = useNodoStore((s) => s.members);
  const morosos = members.filter((m) => !m.cuotaAlDia);

  return (
    <div className="min-h-screen bg-nodo-bg pb-16">
      <Header />
      <div className="pt-16">
        <SectionNav sections={secciones} active={seccion} onChange={setSeccion} />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-nodo-navy">Panel de Administración</h1>
              <p className="text-xs text-slate-500">
                Bienvenido Carlos · Club Social y Deportivo La Unión · Plan 250 Socios
              </p>
            </div>
            {morosos.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-extrabold text-nodo-red ring-1 ring-inset ring-red-200">
                {morosos.length} socios morosos · enviá recordatorios por WhatsApp
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.main
              key={seccion}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {seccion === 'resumen' && (
                <>
                  <StatsOverview />
                  <ReservationManager />
                </>
              )}
              {seccion === 'socios' && <MemberTable />}
              {seccion === 'reservas' && <ReservationManager />}
              {seccion === 'publicidades' && <AdsManager />}
              {seccion === 'planes' && <B2BOverview />}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
