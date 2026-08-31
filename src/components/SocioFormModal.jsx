import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, UserPlus, Save } from 'lucide-react';

const CATEGORIAS = ['Activo', 'Adherente', 'Juvenil', 'Honorario'];
const COLORES = [
  '#0D9488',
  '#0F172A',
  '#059669',
  '#06B6D4',
  '#7C3AED',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
];

const vacio = {
  numero: '',
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  celular: '',
  categoria: 'Activo',
  plan: 18000,
  localidad: '',
  cuotaAlDia: true,
  color: '#0D9488',
};

export default function SocioFormModal({ socio, onGuardar, onCerrar }) {
  const editando = Boolean(socio);
  const [datos, setDatos] = useState(socio ? { ...vacio, ...socio } : vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  const set = (campo) => (e) => {
    const valor = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!datos.numero || !datos.nombre || !datos.apellido) {
      setError('Número, nombre y apellido son obligatorios.');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar({
        numero: datos.numero,
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni: datos.dni,
        email: datos.email,
        celular: datos.celular,
        categoria: datos.categoria,
        plan: datos.plan,
        localidad: datos.localidad,
        cuotaAlDia: datos.cuotaAlDia,
        color: datos.color,
      });
    } catch (err) {
      const msg = err?.message || '';
      setError(
        msg.includes('duplicate') || msg.includes('unique')
          ? 'Ya existe un socio con ese número.'
          : 'No se pudo guardar. Revisá los datos e intentá de nuevo.'
      );
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-nodo-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <motion.form
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={enviar}
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-nodo-border px-5 py-4">
          <h3 className="flex items-center gap-2 font-extrabold text-nodo-navy">
            {editando ? <Save size={18} /> : <UserPlus size={18} />}
            {editando ? `Editar socio N° ${socio.numero}` : 'Alta de socio'}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Campo label="N° de socio" value={datos.numero} onChange={set('numero')} required />
          <Campo label="DNI" value={datos.dni} onChange={set('dni')} />
          <Campo label="Nombre" value={datos.nombre} onChange={set('nombre')} required />
          <Campo label="Apellido" value={datos.apellido} onChange={set('apellido')} required />
          <Campo label="Email" type="email" value={datos.email} onChange={set('email')} />
          <Campo label="Celular" value={datos.celular} onChange={set('celular')} />
          <Campo label="Localidad / barrio" value={datos.localidad} onChange={set('localidad')} />
          <Campo
            label="Cuota mensual ($)"
            type="number"
            value={datos.plan}
            onChange={set('plan')}
          />
          <label className="text-xs font-bold text-slate-500">
            Categoría
            <select
              value={datos.categoria}
              onChange={set('categoria')}
              className="mt-1 w-full rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
            >
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={datos.cuotaAlDia}
              onChange={(e) => setDatos((d) => ({ ...d, cuotaAlDia: e.target.checked }))}
              className="h-4 w-4 rounded border-nodo-border text-nodo-teal focus:ring-nodo-cyan"
            />
            Cuota al día
          </label>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-xs font-bold text-slate-500">Color del carnet</p>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDatos((d) => ({ ...d, color: c }))}
                  className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${
                    datos.color === c ? 'ring-nodo-navy' : 'ring-transparent'
                  }`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mx-5 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-nodo-red">
            {error}
          </p>
        )}

        <div className="flex gap-2 border-t border-nodo-border p-4">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-nodo-navy-2 disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editando ? (
              'Guardar cambios'
            ) : (
              'Dar de alta'
            )}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Campo({ label, type = 'text', ...props }) {
  return (
    <label className="text-xs font-bold text-slate-500">
      {label}
      <input
        {...props}
        type={type}
        className="mt-1 w-full rounded-xl border-0 bg-nodo-surface px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
      />
    </label>
  );
}
