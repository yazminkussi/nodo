import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Trash2, MapPin, Percent } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';

const colores = ['#059669', '#0D9488', '#06B6D4', '#F59E0B', '#1E293B', '#7C3AED'];

export default function AdsManager() {
  const ads = useNodoStore((s) => s.ads);
  const addAd = useNodoStore((s) => s.addAd);
  const removeAd = useNodoStore((s) => s.removeAd);
  const addToast = useNodoStore((s) => s.addToast);

  const [form, setForm] = useState({
    negocio: '',
    rubro: '',
    descuento: '10% OFF',
    descripcion: '',
    barrio: '',
    color: colores[0],
    destacada: false,
  });

  const crear = (e) => {
    e.preventDefault();
    if (!form.negocio.trim() || !form.descripcion.trim()) {
      addToast('Completá negocio y descripción.', 'error');
      return;
    }
    addAd({ ...form, negocio: form.negocio.trim(), rubro: form.rubro.trim() || 'Comercio local' });
    addToast(`Publicidad de ${form.negocio} activada.`, 'success');
    setForm({
      negocio: '',
      rubro: '',
      descuento: '10% OFF',
      descripcion: '',
      barrio: '',
      color: colores[0],
      destacada: false,
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">
          Publicidades de Comercios
        </h2>
        <p className="text-xs text-slate-500">
          Sponsors del barrio con descuentos exclusivos para socios.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <form
          onSubmit={crear}
          className="space-y-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border lg:col-span-2"
        >
          <h3 className="flex items-center gap-2 font-extrabold text-nodo-navy">
            <Plus size={16} className="text-nodo-teal" /> Nueva publicidad
          </h3>
          <input
            value={form.negocio}
            onChange={(e) => setForm({ ...form, negocio: e.target.value })}
            placeholder="Nombre del comercio"
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })}
              placeholder="Rubro (ej. Alimentos)"
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
            />
            <input
              value={form.descuento}
              onChange={(e) => setForm({ ...form, descuento: e.target.value })}
              placeholder="10% OFF"
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
            />
          </div>
          <input
            value={form.barrio}
            onChange={(e) => setForm({ ...form, barrio: e.target.value })}
            placeholder="Barrio"
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
          />
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descuento y condiciones para socios…"
            rows={2}
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
          />
          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-500">Color de marca</p>
            <div className="flex gap-2">
              {colores.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-nodo-navy' : ''}`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={form.destacada}
              onChange={(e) => setForm({ ...form, destacada: e.target.checked })}
              className="h-4 w-4 rounded accent-nodo-cyan"
            />
            Publicidad destacada
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
          >
            Activar publicidad
          </button>
        </form>

        <div className="lg:col-span-3">
          <AnimatePresence>
            {ads.map((ad) => (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-nodo-border"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: ad.color }}
                >
                  <Store size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-extrabold text-nodo-navy">{ad.negocio}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-nodo-green-dark">
                      <Percent size={10} /> {ad.descuento}
                    </span>
                    {ad.destacada && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-nodo-amber">
                        Destacada
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{ad.descripcion}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-nodo-teal">
                    <MapPin size={10} /> {ad.barrio}
                  </p>
                </div>
                <button
                  onClick={() => {
                    removeAd(ad.id);
                    addToast(`Publicidad de ${ad.negocio} retirada.`, 'info');
                  }}
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-nodo-red"
                  title="Retirar publicidad"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
