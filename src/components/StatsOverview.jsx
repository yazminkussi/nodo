import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, TrendingUp, CalendarCheck2 } from 'lucide-react';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { useComunidadActiva } from '../store/useSesion';
import { useSocios } from '../hooks/useSocios';
import { stagger, staggerItem } from './ui/motion';
import { formatARS, todayISO, slotsDeHorario, diaActivo } from '../data/mockData';

const sinMovimiento =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Contador({ valor, format = (n) => n.toLocaleString('es-AR') }) {
  const [mostrado, setMostrado] = useState(sinMovimiento ? valor : 0);
  const ref = useRef(0);

  useEffect(() => {
    if (sinMovimiento) {
      setMostrado(valor);
      return undefined;
    }
    let raf = requestAnimationFrame(function tick() {
      ref.current += (valor - ref.current) * 0.12;
      if (Math.abs(valor - ref.current) < 0.5) {
        setMostrado(valor);
        return;
      }
      setMostrado(ref.current);
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  return <span className="tabular-nums">{format(Math.round(mostrado))}</span>;
}

export default function StatsOverview() {
  const { socios: members } = useSocios();
  const reservations = useNodoStore((s) => s.reservations);
  const espacios = useNodoStore((s) => s.espacios);
  const comunidadDemo = useComunidadActual();
  const comunidad = useComunidadActiva() || comunidadDemo;

  const total = members.length;
  const alDia = members.filter((m) => m.cuotaAlDia).length;
  const morosos = total - alDia;
  const pctAlDia = total ? Math.round((alDia / total) * 100) : 0;
  const recaudacion = members.filter((m) => m.cuotaAlDia).reduce((acc, m) => acc + m.plan, 0);

  const hoy = todayISO();
  const slotsTotales = espacios.reduce((acc, e) => {
    if (!diaActivo(e.horario.dias, hoy)) return acc;
    return acc + slotsDeHorario(e.horario).length;
  }, 0);
  const reservasHoy = reservations.filter((r) => r.fecha === hoy).length;
  const ocupacion = slotsTotales
    ? Math.min(100, Math.round((reservasHoy / slotsTotales) * 100))
    : 0;

  const tarjetas = [
    {
      titulo: 'Socios activos',
      valor: <Contador valor={total} />,
      detalle: `Plan ${String(comunidad.plan || '').replace('Plan ', '')}`,
      icon: Users,
      hero: true,
    },
    {
      titulo: 'Recaudación mensual',
      valor: <Contador valor={recaudacion} format={(n) => formatARS(n)} />,
      detalle: 'Estimada, cuotas al día',
      icon: Wallet,
      tint: 'text-ok bg-ok-soft',
    },
    {
      titulo: 'Cuotas al día',
      valor: <Contador valor={pctAlDia} format={(n) => `${n}%`} />,
      detalle: `${alDia} al día · ${morosos} adeudan`,
      icon: TrendingUp,
      tint: 'text-lav bg-lav-soft',
    },
    {
      titulo: 'Ocupación de espacios',
      valor: <Contador valor={ocupacion} format={(n) => `${n}%`} />,
      detalle: `${reservasHoy} reservas hoy · ${slotsTotales} turnos`,
      icon: CalendarCheck2,
      tint: 'text-warn bg-sun-soft',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {tarjetas.map((t) => (
          <motion.div
            key={t.titulo}
            variants={staggerItem}
            whileHover={{ y: -3 }}
            className={`relative overflow-hidden rounded-2xl p-4 shadow-card ${
              t.hero ? 'bg-lav-deep text-cream' : 'border border-line bg-cloud text-ink'
            }`}
          >
            {t.hero && (
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sun/20 blur-2xl" />
            )}
            <div className="flex items-center justify-between">
              <p
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  t.hero ? 'text-cream/70' : 'text-ink-faint'
                }`}
              >
                {t.titulo}
              </p>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  t.hero ? 'bg-white/10 text-cream' : t.tint
                }`}
              >
                <t.icon size={15} strokeWidth={2.2} />
              </span>
            </div>
            <p
              className={`mt-2 font-display text-[1.75rem] font-bold tracking-tight ${
                t.hero ? 'text-sun' : 'text-ink'
              }`}
            >
              {t.valor}
            </p>
            <p
              className={`mt-1 text-[11px] font-semibold ${
                t.hero ? 'text-cream/70' : 'text-ink-soft'
              }`}
            >
              {t.detalle}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
