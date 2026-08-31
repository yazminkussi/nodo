import { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Field from './ui/Field';

const CATEGORIAS = ['Activo', 'Adherente', 'Juvenil', 'Honorario'];
const COLORES = [
  '#5E52C4',
  '#32328E',
  '#2E8B5E',
  '#E8A33D',
  '#C56A46',
  '#7C74D6',
  '#C0453B',
  '#4B8FB0',
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
  color: '#5E52C4',
};

export default function SocioFormModal({ socio, onGuardar, onCerrar }) {
  const editando = Boolean(socio);
  const [datos, setDatos] = useState(socio ? { ...vacio, ...socio } : vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

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
    <Modal
      title={editando ? `Editar socio N° ${socio.numero}` : 'Alta de socio'}
      icon={editando ? Save : UserPlus}
      onClose={onCerrar}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="socio-form"
            variant="lav"
            loading={guardando}
            className="flex-[2]"
          >
            {!guardando && (editando ? 'Guardar cambios' : 'Dar de alta')}
          </Button>
        </>
      }
    >
      <form
        id="socio-form"
        onSubmit={enviar}
        className="grid max-h-[65vh] gap-3 overflow-y-auto p-5 sm:grid-cols-2"
      >
        <Field label="N° de socio" value={datos.numero} onChange={set('numero')} required />
        <Field label="DNI" value={datos.dni} onChange={set('dni')} />
        <Field label="Nombre" value={datos.nombre} onChange={set('nombre')} required />
        <Field label="Apellido" value={datos.apellido} onChange={set('apellido')} required />
        <Field label="Email" type="email" value={datos.email} onChange={set('email')} />
        <Field label="Celular" value={datos.celular} onChange={set('celular')} />
        <Field label="Localidad / barrio" value={datos.localidad} onChange={set('localidad')} />
        <Field label="Cuota mensual ($)" type="number" value={datos.plan} onChange={set('plan')} />

        <label className="block text-xs font-bold text-ink-soft">
          Categoría
          <select
            value={datos.categoria}
            onChange={set('categoria')}
            className="mt-1 w-full rounded-xl border border-line bg-cloud px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lav"
          >
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={datos.cuotaAlDia}
            onChange={(e) => setDatos((d) => ({ ...d, cuotaAlDia: e.target.checked }))}
            className="h-4 w-4 rounded border-line text-lav focus:ring-lav"
          />
          Cuota al día
        </label>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-bold text-ink-soft">Color del carnet</p>
          <div className="flex flex-wrap gap-2">
            {COLORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDatos((d) => ({ ...d, color: c }))}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${
                  datos.color === c ? 'ring-lav-deep' : 'ring-transparent'
                }`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
