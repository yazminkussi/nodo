import { motion } from 'framer-motion';
import { Pin, Megaphone, Loader2 } from 'lucide-react';
import { useComunidadActual } from '../store/useNodoStore';
import { useComunidadActiva } from '../store/useSesion';
import { useNovedades } from '../hooks/useNovedades';
import { formatFechaCorta } from '../data/mockData';

const colorCategoria = {
  Institucional: 'bg-nodo-navy text-white',
  Evento: 'bg-cyan-50 text-nodo-teal ring-cyan-200',
  Comunicado: 'bg-emerald-50 text-nodo-green-dark ring-emerald-200',
  Comunidad: 'bg-amber-50 text-nodo-amber ring-amber-200',
};

export default function Feed() {
  const { novedades, cargando } = useNovedades();
  const comunidadDemo = useComunidadActual();
  const comunidadReal = useComunidadActiva();
  const comunidad = comunidadReal || comunidadDemo;
  const orden = [...novedades].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">
          Novedades y Comunidad
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-nodo-border">
          <Megaphone size={13} /> Oficial de {comunidad.nombre}
        </span>
      </div>

      {cargando && orden.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Cargando novedades…
        </p>
      )}
      {!cargando && orden.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-nodo-border bg-white px-4 py-10 text-center text-sm text-slate-400">
          Todavía no hay novedades publicadas.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {orden.map((n, i) => (
          <motion.article
            key={n.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className={`flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card ring-1 transition-shadow hover:shadow-lift ${
              n.destacada ? 'ring-2 ring-nodo-cyan/40' : 'ring-nodo-border'
            }`}
          >
            <div className="flex items-center gap-2">
              {n.destacada && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-nodo-red ring-1 ring-inset ring-red-200">
                  <Pin size={11} /> DESTACADA
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${colorCategoria[n.categoria] || colorCategoria.Comunidad}`}
              >
                {n.categoria}
              </span>
              <span className="ml-auto text-xs font-semibold text-slate-400">
                {formatFechaCorta(n.fecha)}
              </span>
            </div>
            <h3 className="text-[15px] font-extrabold leading-snug text-nodo-navy">
              <span className="mr-1.5">{n.emoji}</span>
              {n.titulo}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500">{n.contenido}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
