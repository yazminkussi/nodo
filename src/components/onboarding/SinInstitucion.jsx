import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, LogOut, ArrowRight, IdCard, Fingerprint } from 'lucide-react';
import { useSesion } from '../../store/useSesion';
import { useNodoStore } from '../../store/useNodoStore';
import { crearComunidad } from '../../lib/api/onboarding';
import { vincularSocioPorDatos } from '../../lib/api/socios';
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

const campoSelect =
  'w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav';

function FormSocio() {
  const refrescar = useSesion((s) => s.refrescar);
  const setComunidadActiva = useSesion((s) => s.setComunidadActiva);
  const setRole = useNodoStore((s) => s.setRole);
  const addToast = useNodoStore((s) => s.addToast);

  const [numero, setNumero] = useState('');
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!numero.trim() || !dni.trim()) return setError('Completá tu número de socio y tu DNI.');
    setCargando(true);
    try {
      const slug = await vincularSocioPorDatos(numero.trim(), dni.trim());
      setRole('socio');
      await setComunidadActiva(slug);
      await refrescar();
      addToast('¡Listo! Vinculamos tu ficha de socio.', 'success');
    } catch (err) {
      setError(err?.message || 'No se pudo vincular tu ficha.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-paper p-6 shadow-lift">
      <p className="text-sm text-ink-soft">
        Si tu club ya te cargó como socio, vinculá tu ficha con el número de socio y tu DNI (los
        datos que figuran en tu carnet).
      </p>
      <Field
        icon={IdCard}
        label="Número de socio"
        placeholder="Ej. 0142"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        required
        autoFocus
      />
      <Field
        icon={Fingerprint}
        label="DNI"
        placeholder="Sin puntos"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        inputMode="numeric"
        required
      />
      {error && (
        <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">{error}</p>
      )}
      <Button type="submit" variant="lav" size="lg" loading={cargando} className="w-full">
        Vincular mi ficha <ArrowRight size={16} />
      </Button>
      <p className="text-center text-xs text-ink-faint">
        ¿No aparece? Pedile a tu club que cargue tu ficha (o que la vincule a tu email).
      </p>
    </form>
  );
}

function FormClub() {
  const refrescar = useSesion((s) => s.refrescar);
  const setComunidadActiva = useSesion((s) => s.setComunidadActiva);
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

  return (
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
        <Field label="Barrio" placeholder="Barrio" value={form.barrio} onChange={set('barrio')} />
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
        <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">{error}</p>
      )}
      <Button type="submit" variant="lav" size="lg" loading={cargando} className="w-full">
        Crear institución <ArrowRight size={16} />
      </Button>
    </form>
  );
}

export default function SinInstitucion() {
  const perfil = useSesion((s) => s.perfil);
  const salir = useSesion((s) => s.salir);
  const [modo, setModo] = useState('socio'); // socio | club

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
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {perfil?.nombre ? `Hola ${perfil.nombre}` : 'Bienvenida a NODO'}
          </h1>
          <p className="text-sm text-cream/70">
            Tu cuenta todavía no está conectada a ninguna institución.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
          {[
            { key: 'socio', label: 'Soy socio de un club' },
            { key: 'club', label: 'Administro un club' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setModo(t.key)}
              className={`relative rounded-lg py-2 text-xs font-bold transition-colors ${
                modo === t.key ? 'text-ink' : 'text-cream/70'
              }`}
            >
              {modo === t.key && (
                <motion.span
                  layoutId="sininst-tab"
                  className="absolute inset-0 -z-10 rounded-lg bg-paper shadow-card"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>

        {modo === 'socio' ? <FormSocio /> : <FormClub />}

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
