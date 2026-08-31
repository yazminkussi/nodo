import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  Store,
  Building2,
  Palette,
  FolderOpen,
  QrCode,
} from 'lucide-react';
import { Header, SectionNav } from './Navbar';
import StatsOverview from './StatsOverview';
import MemberTable from './MemberTable';
import ReservationManager from './ReservationManager';
import AdsManager from './AdsManager';
import B2BOverview from './B2BOverview';
import CommunitySettings from './CommunitySettings';
import NodoDrive from './NodoDrive';
import AdminRoleSwitcher from './AdminRoleSwitcher';
import QrAccessControl from './qr/QrAccessControl';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { ROLES_ADMIN } from '../data/mockData';

const seccionesBase = [
  { key: 'resumen', label: 'Panel', icon: LayoutDashboard },
  { key: 'acceso', label: 'Escanear QR', icon: QrCode },
  { key: 'socios', label: 'Socios', icon: Users },
  { key: 'reservas', label: 'Reservas', icon: CalendarRange },
  { key: 'publicidades', label: 'Publicidades', icon: Store },
  { key: 'planes', label: 'Planes NODO', icon: Building2 },
  { key: 'drive', label: 'Drive Interno', icon: FolderOpen },
  { key: 'personalizacion', label: 'Personalización', icon: Palette },
];

export default function AdminDashboard() {
  const members = useNodoStore((s) => s.members);
  const adminRole = useNodoStore((s) => s.adminRole);
  const comunidad = useComunidadActual();
  const morosos = members.filter((m) => !m.cuotaAlDia);

  const permitidas = useMemo(() => ROLES_ADMIN[adminRole]?.secciones || [], [adminRole]);
  const secciones = seccionesBase.filter((s) => permitidas.includes(s.key));
  const [seccion, setSeccion] = useState('resumen');

  useEffect(() => {
    if (!permitidas.includes(seccion)) setSeccion('resumen');
  }, [seccion, permitidas]);

  const rol = ROLES_ADMIN[adminRole];

  return (
    <div className="min-h-screen bg-nodo-bg pb-16">
      <Header />
      <div className="pt-16">
        <SectionNav sections={secciones} active={seccion} onChange={setSeccion} />

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-nodo-navy">
                Panel de Administración
              </h1>
              <p className="text-xs text-slate-500">
                Bienvenido Carlos · {comunidad.nombre} · {comunidad.plan}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-extrabold text-nodo-teal ring-1 ring-inset ring-cyan-200">
                {rol?.etiqueta}
              </span>
              {morosos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-extrabold text-nodo-red ring-1 ring-inset ring-red-200">
                  {morosos.length} socios adeudan · enviá recordatorios por WhatsApp
                </span>
              )}
            </div>
          </div>

          <AdminRoleSwitcher />

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
              {seccion === 'acceso' && <QrAccessControl />}
              {seccion === 'socios' && <MemberTable />}
              {seccion === 'reservas' && <ReservationManager />}
              {seccion === 'publicidades' && <AdsManager />}
              {seccion === 'planes' && <B2BOverview />}
              {seccion === 'drive' && <NodoDrive />}
              {seccion === 'personalizacion' && <CommunitySettings />}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
