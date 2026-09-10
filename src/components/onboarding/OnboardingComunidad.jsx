import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, LogOut, ArrowRight } from 'lucide-react';
import { useSesion } from '../../store/useSesion';
import { useNodoStore } from '../../store/useNodoStore';
import { crearComunidad } from '../../lib/api/onboarding';
import { planesB2B } from '../../data/mockData';
import NodoMark from '../ui/NodoMark';
import Field from '../ui/Field';
import Button from '../ui/Button';

const TIPOS = [
  'Club Social y Deportivo',
  'Centro Cultural',
  'Movimiento Juvenil',
  'Asociación Civil',
  'Polideportivo',
  'Otro',
];

export default function OnboardingComunidad() {
  const perfil = useSesion((s) => s.perfil);
  const refrescar = useSesion((s) => s.refrescar);
  const setComunidadActiva = useSesion((s) => s.setComunidadActiva);
  const salir = useSesion((s) => s.salir);
  const setRole = useNodoStore((s) => s.setRole);
  const addToast = useNodoStore((s) => s.addToast);

  const [form, setForm] = useState({
    nombre: '',
    tipo: TIPOS[0],
    ciudad: '',
    barrio: '',
    plan: planesB2B[0].nombre,
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim()) return setError('Escribí el nombre del club.');
    setCargando(true);
    try {
      const slug = await crearComunidad(form);
      setRole('admin');
      await setComunidadActiva(slug);
      await refrescar();
      addToast(`¡Listo! ${form.nombre.trim()} ya está en NODO.`, 'success');
    } catch (err) {
      setError(err?.message || 'No se pudo crear la institución.');
      setCargando(false);
    }
  };

  const campoSelect =
    'w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lav-deep px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-sun/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-lav/25 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center text-center text-cream">
          <NodoMark size={48} color="#F3EFE6" animate className="mb-2" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Creá tu institución</h1>
          <p className="text-sm text-cream/70">
            {perfil?.nombre ? `Hola ${perfil.nombre}. ` : ''}
            Con esto quedás como administrador y podés cargar tus socios.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-paper p-6 shadow-lift">
          <Field
            icon={Building2}
            label="Nombre del club"
            placeholder="Ej. Club Social y Deportivo La Unión"
            value={form.nombre}
            onChange={set('nombre')}
            required
            autoFocus
          />

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Tipo de institución</span>
            <select className={campoSelect} value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={MapPin}
              label="Ciudad"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={set('ciudad')}
            />
            <Field
              label="Barrio"
              placeholder="Barrio"
              value={form.barrio}
              onChange={set('barrio')}
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">Plan</span>
            <select className={campoSelect} value={form.plan} onChange={set('plan')}>
              {planesB2B.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre} · {p.socios}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-faint">
              Podés cambiarlo después desde Personalización.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
              {error}
            </p>
          )}

          <Button type="submit" variant="lav" size="lg" loading={cargando} className="w-full">
            Crear institución <ArrowRight size={16} />
          </Button>
        </form>

        <button
          type="button"
          onClick={salir}
          className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-semibold text-cream/70 transition hover:text-cream"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
}
