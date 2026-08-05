import { useRef, useState } from 'react';
import { Upload, ImageOff, Trash2, Save, Palette, Info, ShieldCheck } from 'lucide-react';
import { useNodoStore, useComunidadActual } from '../store/useNodoStore';
import { NodoLogo } from './Navbar';
import { redimensionarLogo } from '../utils/image';

const especificaciones = [
  { titulo: 'Tamaño recomendado', detalle: '512 × 512 px · relación 1:1 (cuadrada).' },
  { titulo: 'Formatos admitidos', detalle: 'PNG (con fondo transparente, recomendado) o JPG.' },
  { titulo: 'Cómo se verá', detalle: 'Tu logo se muestra al lado del logo de NODO, a la misma altura.' },
  { titulo: 'Peso máximo', detalle: 'Hasta 2 MB. Se reescala automáticamente a 512 px.' },
];

function Campo({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
      />
    </label>
  );
}

export default function CommunitySettings() {
  const comunidad = useComunidadActual();
  const updateComunidad = useNodoStore((s) => s.updateComunidad);
  const addToast = useNodoStore((s) => s.addToast);

  const fileRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [form, setForm] = useState(() => ({
    nombre: comunidad.nombre,
    institucion: comunidad.institucion,
    tipo: comunidad.tipo,
    direccion: comunidad.direccion,
    ciudad: comunidad.ciudad,
    cuit: comunidad.cuit,
    telefono: comunidad.telefono,
    email: comunidad.email,
  }));

  const aplicarLogo = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await redimensionarLogo(file);
      updateComunidad(comunidad.id, { logo: dataUrl });
      addToast('Logo de la comunidad actualizado.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const guardar = () => {
    updateComunidad(comunidad.id, form);
    addToast('Datos de la comunidad guardados.', 'success');
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-nodo-navy">
            <Palette size={19} className="text-nodo-teal" /> Personalización de Comunidad
          </h2>
          <p className="text-xs text-slate-500">
            Solo visible para SuperAdmin / Tesorero · {comunidad.nombre}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-nodo-green-dark ring-1 ring-inset ring-emerald-200">
          <ShieldCheck size={13} /> Rol con acceso total
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold text-nodo-navy">
              <Upload size={16} className="text-nodo-teal" /> Logo de la comunidad
            </h3>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => aplicarLogo(e.target.files?.[0])}
            />

            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                aplicarLogo(e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors ${
                arrastrando
                  ? 'border-nodo-cyan bg-cyan-50'
                  : 'border-nodo-border bg-nodo-surface hover:border-nodo-cyan hover:bg-cyan-50/60'
              }`}
            >
              {comunidad.logo ? (
                <img
                  src={comunidad.logo}
                  alt="Logo de la comunidad"
                  className="h-20 w-20 rounded-2xl bg-white object-contain shadow-card ring-1 ring-nodo-border"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-nodo-navy text-white">
                  <ImageOff size={26} />
                </span>
              )}
              <p className="text-sm font-extrabold text-nodo-navy">
                {comunidad.logo ? 'Reemplazar logo' : 'Subir logo de la comunidad'}
              </p>
              <p className="text-xs text-slate-500">
                Hacé clic o arrastrá tu archivo · PNG o JPG · máximo 2 MB
              </p>
            </button>

            {comunidad.logo && (
              <button
                onClick={() => {
                  updateComunidad(comunidad.id, { logo: null });
                  addToast('Logo restaurado a la versión estándar.', 'info');
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-bold text-nodo-red ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
              >
                <Trash2 size={13} /> Quitar logo personalizado
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold text-nodo-navy">
              <Info size={16} className="text-nodo-teal" /> Especificaciones del logo
            </h3>
            <ul className="space-y-2.5">
              {especificaciones.map((e) => (
                <li key={e.titulo} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-nodo-teal" />
                  <span>
                    <span className="font-bold text-nodo-navy">{e.titulo}: </span>
                    <span className="text-slate-500">{e.detalle}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl bg-nodo-navy shadow-lift ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <p className="text-xs font-extrabold uppercase tracking-widest text-nodo-cyan">
                Vista previa en vivo · Co-Branding
              </p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                Header principal
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 px-5 py-6">
              <NodoLogo className="h-11 w-11" />
              <span className="h-9 w-px bg-white/20" />
              {comunidad.logo ? (
                <img
                  src={comunidad.logo}
                  alt={comunidad.nombre}
                  className="h-11 w-11 rounded-full bg-white object-contain p-0.5"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/25 text-slate-400">
                  <ImageOff size={16} />
                </span>
              )}
              <span className="leading-tight">
                <span className="block text-sm font-extrabold text-white">
                  {form.nombre || comunidad.nombre}
                </span>
                <span className="block text-[11px] font-semibold text-slate-400">
                  {form.tipo || comunidad.tipo} · {comunidad.plan}
                </span>
              </span>
            </div>
            <p className="border-t border-white/10 px-5 py-2.5 text-[11px] text-slate-400">
              Así se ve [NODO] + [Tu logo] + [Nombre] en la barra superior, a igual altura.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-nodo-border">
            <h3 className="mb-4 font-extrabold text-nodo-navy">Datos de la institución</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo label="Nombre de la comunidad" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              </div>
              <Campo label="Tipo de institución" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
              <Campo label="Plan NODO" value={comunidad.plan} onChange={() => {}} />
              <Campo label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
              <Campo label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} />
              <Campo label="CUIT" value={form.cuit} onChange={(v) => setForm({ ...form, cuit: v })} />
              <Campo label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
              <div className="sm:col-span-2">
                <Campo label="Email de contacto" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              </div>
            </div>
            <button
              onClick={guardar}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-nodo-navy px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-nodo-navy-2"
            >
              <Save size={16} /> Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
