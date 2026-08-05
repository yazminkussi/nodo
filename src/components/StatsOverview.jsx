import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, TrendingUp, CalendarCheck2 } from 'lucide-react';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { formatARS, HORARIOS, todayISO } from '../data/mockData';

function Contador({ valor, format = (n) => n.toLocaleString('es-AR') }) {
  const [mostrado, setMostrado] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const anim = requestAnimationFrame(function tick() {
      ref.current += (valor - ref.current) * 0.12;
      if (Math.abs(valor - ref.current) < 0.5) {
        setMostrado(valor);
        return;
      }
      setMostrado(ref.current);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(anim);
  }, [valor]);

  return <span>{format(Math.round(mostrado))}</span>;
}

export default function StatsOverview() {
  const members = useNodoStore((s) => s.members);
  const reservations = useNodoStore((s) => s.reservations);
  const espacios = useNodoStore((s) => s.espacios);
  const comunidad = useComunidadActual();

  const total = members.length;
  const alDia = members.filter((m) => m.cuotaAlDia).length;
  const morosos = total - alDia;
  const pctAlDia = total ? Math.round((alDia / total) * 100) : 0;
  const recaudacion = members.filter((m) => m.cuotaAlDia).reduce((acc, m) => acc + m.plan, 0);

  const hoy = todayISO();
  const slotsTotales = espacios.length * HORARIOS.length;
  const reservasHoy = reservations.filter((r) => r.fecha === hoy).length;
  const ocupacion = slotsTotales ? Math.round((reservasHoy / slotsTotales) * 100) : 0;

  const tarjetas = [
    {
      titulo: 'Socios activos',
      valor: <Contador valor={total} />,
      detalle: `Plan ${comunidad.plan.replace('Plan ', '')}`,
      icon: Users,
      color: 'from-nodo-navy to-nodo-navy-2',
    },
    {
      titulo: 'Recaudación mensual',
      valor: <Contador valor={recaudacion} format={(n) => formatARS(n)} />,
      detalle: 'Estimada, cuotas al día',
      icon: Wallet,
      color: 'from-nodo-green to-nodo-green-dark',
    },
    {
      titulo: 'Cuotas al día',
      valor: <Contador valor={pctAlDia} format={(n) => `${n}%`} />,
      detalle: `${alDia} al día · ${morosos} morosos`,
      icon: TrendingUp,
      color: 'from-cyan-500 to-nodo-teal',
    },
    {
      titulo: 'Ocupación de espacios',
      valor: <Contador valor={ocupacion} format={(n) => `${n}%`} />,
      detalle: `${reservasHoy} reservas hoy`,
      icon: CalendarCheck2,
      color: 'from-nodo-amber to-orange-500',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t, i) => (
          <motion.div
            key={t.titulo}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.color} p-4 text-white shadow-card`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">{t.titulo}</p>
              <t.icon size={18} className="opacity-90" strokeWidth={2.2} />
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{t.valor}</p>
            <p className="mt-1 text-[11px] font-semibold opacity-80">{t.detalle}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
