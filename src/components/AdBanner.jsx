import { motion } from 'framer-motion';
import { Store, MapPin, Percent } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';

export default function AdBanner() {
  const ads = useNodoStore((s) => s.ads);
  const orden = [...ads].sort((a, b) => Number(b.destacada) - Number(a.destacada));

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">
          Comercios del barrio
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-nodo-amber ring-1 ring-inset ring-amber-200">
          <Percent size={13} /> Descuentos para socios
        </span>
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {orden.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className={`relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 transition-shadow hover:shadow-lift ${
              ad.destacada ? 'ring-2 ring-nodo-amber/50' : 'ring-nodo-border'
            }`}
          >
            <div
              className="absolute right-0 top-0 rounded-bl-xl px-2.5 py-1 text-xs font-extrabold text-white"
              style={{ background: ad.color }}
            >
              {ad.descuento}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ background: ad.color }}
              >
                <Store size={16} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-nodo-navy">{ad.negocio}</p>
                <p className="text-[11px] font-semibold text-slate-400">{ad.rubro}</p>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{ad.descripcion}</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-nodo-teal">
              <MapPin size={11} /> {ad.barrio}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
