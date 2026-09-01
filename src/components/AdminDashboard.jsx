import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  Store,
  Building2,
  Palette,
  FolderOpen,
  QrCode,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';
import { Header, SectionNav } from './Navbar';
import StatsOverview from './StatsOverview';
import MemberTable from './MemberTable';
import ReservationManager from './ReservationManager';
import NovedadesManager from './NovedadesManager';
import EquipoManager from './EquipoManager';
import AdsManager from './AdsManager';
import B2BOverview from './B2BOverview';
import CommunitySettings from './CommunitySettings';
import NodoDrive from './NodoDrive';
import AdminRoleSwitcher from './AdminRoleSwitcher';
import QrAccessControl from './qr/QrAccessControl';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { useComunidadActiva, useSesion, useRolActivo } from '../store/useSesion';
import { useSocios } from '../hooks/useSocios';
import { ROLES_ADMIN } from '../data/mockData';

const seccionesBase = [
  { key: 'resumen', label: 'Panel', icon: LayoutDashboard },
  { key: 'acceso', label: 'Escanear QR', icon: QrCode },
  { key: 'socios', label: 'Socios', icon: Users },
  { key: 'reservas', label: 'Reservas', icon: CalendarRange },
  { key: 'novedades', label: 'Novedades', icon: Newspaper },
  { key: 'publicidades', label: 'Publicidades', icon: Store },
  { key: 'planes', label: 'Planes NODO', icon: Building2 },
  { key: 'equipo', label: 'Equipo', icon: ShieldCheck },
  { key: 'drive', label: 'Drive Interno', icon: FolderOpen },
  { key: 'personalizacion', label: 'Personalización', icon: Palette },
];

export default function AdminDashboard() {
  const { socios: members } = useSocios();
  const adminRoleDemo = useNodoStore((s) => s.adminRole);
  const comunidadDemo = useComunidadActual();
  const comunidad = useComunidadActiva() || comunidadDemo;
  const perfil = useSesion((s) => s.perfil);
  const estadoSesion = useSesion((s) => s.estado);
  const rolReal = useRolActivo();
  const morosos = members.filter((m) => !m.cuotaAlDia);
  const saludo = perfil?.nombre ? perfil.nombre : 'Carlos';

  // Con sesión real, el rol viene de la membresía; en demo, del selector local.
  const adminRole =
    estadoSesion === 'activo' && rolReal && rolReal !== 'socio' ? rolReal : adminRoleDemo;

  const permitidas = useMemo(() => ROLES_ADMIN[adminRole]?.secciones || [], [adminRole]);
  const secciones = seccionesBase.filter((s) => permitidas.includes(s.key));
  const [seccion, setSeccion] = useState('resumen');

  useEffect(() => {
    if (!permitidas.includes(seccion)) setSeccion('resumen');
  }, [seccion, permitidas]);

  const rol = ROLES_ADMIN[adminRole];

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Header />
      <div className="pt-16">
        <SectionNav sections={secciones} active={seccion} onChange={setSeccion} />

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cloud p-4 shadow-card">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                Panel de administración
              </h1>
              <p className="text-xs text-ink-soft">
                Hola {saludo} · {comunidad.nombre} · {comunidad.plan}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-lav-soft px-3 py-1.5 text-xs font-bold text-lav-deep">
                {rol?.etiqueta}
              </span>
              {morosos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-crit-soft px-3 py-1.5 text-xs font-bold text-[#9c372f]">
                  {morosos.length} socios adeudan · enviá recordatorios por WhatsApp
                </span>
              )}
            </div>
          </div>

          {estadoSesion !== 'activo' && <AdminRoleSwitcher />}

          <motion.main
            key={seccion}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
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
            {seccion === 'novedades' && <NovedadesManager />}
            {seccion === 'publicidades' && <AdsManager />}
            {seccion === 'planes' && <B2BOverview />}
            {seccion === 'equipo' && <EquipoManager />}
            {seccion === 'drive' && <NodoDrive />}
            {seccion === 'personalizacion' && <CommunitySettings />}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
