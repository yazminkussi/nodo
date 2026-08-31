import { motion } from 'framer-motion';
import { Store, MapPin, Percent } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import Chip from './ui/Chip';

export default function AdBanner() {
  const ads = useNodoStore((s) => s.ads);
  const orden = [...ads].sort((a, b) => Number(b.destacada) - Number(a.destacada));

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          Comercios del barrio
        </h2>
        <Chip tono="sun" icon={Percent}>
          Descuentos para socios
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orden.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className={`relative overflow-hidden rounded-2xl bg-cloud p-4 shadow-card transition-shadow hover:shadow-lift ${
              ad.destacada ? 'ring-2 ring-sun/50' : 'ring-1 ring-line'
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
                <p className="text-sm font-bold text-ink">{ad.negocio}</p>
                <p className="text-[11px] font-semibold text-ink-faint">{ad.rubro}</p>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{ad.descripcion}</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-lav">
              <MapPin size={11} /> {ad.barrio}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
