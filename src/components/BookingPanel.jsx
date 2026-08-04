import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Users } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { formatARS } from '../data/mockData';
import SpaceIcon from './SpaceIcon';
import BookingModal from './BookingModal';

const categorias = ['Todos', 'Deportivo', 'Cultural', 'Recreativo'];

export default function BookingPanel() {
  const espacios = useNodoStore((s) => s.espacios);
  const [filtro, setFiltro] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);

  const visibles = espacios.filter((e) => filtro === 'Todos' || e.categoria === filtro);

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-nodo-navy">Reservá tu espacio</h2>
        <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-nodo-border sm:inline-flex">
          <CalendarRange size={13} /> Sin doble reservas
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filtro === c ? 'bg-nodo-navy text-white shadow-card' : 'bg-white text-slate-500 ring-1 ring-inset ring-nodo-border hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((esp, i) => (
          <motion.button
            key={esp.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSeleccionado(esp)}
            className="group flex flex-col gap-3 rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-nodo-border transition-shadow hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card"
                style={{ background: esp.color }}
              >
                <SpaceIcon icono={esp.icono} className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">{esp.categoria}</span>
            </div>
            <div>
              <h3 className="font-extrabold text-nodo-navy">{esp.nombre}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{esp.descripcion}</p>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-nodo-border pt-3 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-nodo-cyan" /> {esp.capacidad} personas
              </span>
              <span className="font-extrabold text-nodo-teal">{formatARS(esp.precioHora)}<span className="font-medium text-slate-400"> / h</span></span>
            </div>
            <span className="rounded-lg bg-cyan-50 py-2 text-center text-xs font-bold text-nodo-teal transition-colors group-hover:bg-nodo-cyan group-hover:text-white">
              Reservar ahora
            </span>
          </motion.button>
        ))}
      </div>

      {seleccionado && <BookingModal espacio={seleccionado} onClose={() => setSeleccionado(null)} />}
    </section>
  );
}
