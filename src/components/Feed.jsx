import { motion } from 'framer-motion';
import { Pin, Megaphone, Loader2, Newspaper } from 'lucide-react';
import { useComunidadActual } from '../store/useNodoStore';
import { useComunidadActiva } from '../store/useSesion';
import { useNovedades } from '../hooks/useNovedades';
import { formatFechaCorta } from '../data/mockData';
import { stagger, staggerItem } from './ui/motion';
import Chip from './ui/Chip';
import EmptyState from './ui/EmptyState';

const colorCategoria = {
  Institucional: 'bg-lav text-cream',
  Evento: 'bg-lav-soft text-lav-deep',
  Comunicado: 'bg-ok-soft text-[#1c5a3d]',
  Comunidad: 'bg-sun-soft text-[#97621b]',
};

export default function Feed() {
  const { novedades, cargando } = useNovedades();
  const comunidadDemo = useComunidadActual();
  const comunidadReal = useComunidadActiva();
  const comunidad = comunidadReal || comunidadDemo;
  const orden = [...novedades].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          Novedades y comunidad
        </h2>
        <Chip tono="sand" icon={Megaphone}>
          Oficial de {comunidad.nombre}
        </Chip>
      </div>

      {cargando && orden.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-ink-faint">
          <Loader2 size={16} className="animate-spin" /> Cargando novedades…
        </p>
      )}
      {!cargando && orden.length === 0 && (
        <EmptyState icon={Newspaper} title="Todavía no hay novedades publicadas" />
      )}

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {orden.map((n) => (
          <motion.article
            key={n.id}
            variants={staggerItem}
            whileHover={{ y: -2 }}
            className={`flex flex-col gap-2 rounded-2xl bg-cloud p-4 shadow-card transition-shadow hover:shadow-lift ${
              n.destacada ? 'ring-2 ring-sun/45' : 'ring-1 ring-line'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {n.destacada && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sun-soft px-2 py-0.5 text-[10px] font-extrabold text-[#97621b]">
                  <Pin size={11} /> DESTACADA
                </span>
              )}
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${colorCategoria[n.categoria] || colorCategoria.Comunidad}`}
              >
                {n.categoria}
              </span>
              <span className="ml-auto text-xs font-semibold text-ink-faint">
                {formatFechaCorta(String(n.fecha))}
              </span>
            </div>
            <h3 className="font-display text-[15px] font-bold leading-snug text-ink">
              <span className="mr-1.5">{n.emoji}</span>
              {n.titulo}
            </h3>
            <p className="text-sm leading-relaxed text-ink-soft">{n.contenido}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
