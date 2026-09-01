import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Mail, ShieldCheck, Trophy, Palette, Loader2, X } from 'lucide-react';
import { useNodoStore } from '../store/useNodoStore';
import { useSesion, useRolActivo } from '../store/useSesion';
import {
  listarEquipo,
  listarInvitaciones,
  crearInvitacion,
  revocarInvitacion,
  quitarAdmin,
} from '../lib/api/equipo';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Field from './ui/Field';
import SectionTitle from './ui/SectionTitle';
import EmptyState from './ui/EmptyState';
import { formatFechaCorta } from '../data/mockData';

const ROLES = [
  {
    id: 'deportes',
    etiqueta: 'Admin de Deportes',
    icono: Trophy,
    categorias: ['Deportivo'],
    desc: 'Canchas, espacios deportivos y horarios.',
  },
  {
    id: 'talleres',
    etiqueta: 'Admin de Talleres / Cultura',
    icono: Palette,
    categorias: ['Cultural'],
    desc: 'Talleres y actividades culturales.',
  },
  {
    id: 'superadmin',
    etiqueta: 'SuperAdmin / Tesorero',
    icono: ShieldCheck,
    categorias: [],
    desc: 'Acceso total, incluida la facturación.',
  },
];

const rolInfo = (id) => ROLES.find((r) => r.id === id) || ROLES[0];

export default function EquipoManager() {
  const estado = useSesion((s) => s.estado);
  const comunidadId = useSesion((s) => s.comunidadActivaId);
  const rolActivo = useRolActivo();
  const perfil = useSesion((s) => s.perfil);
  const addToast = useNodoStore((s) => s.addToast);

  const [equipo, setEquipo] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const esSuperadmin = rolActivo === 'superadmin';

  const recargar = useCallback(() => {
    if (estado !== 'activo' || !comunidadId) return;
    setCargando(true);
    Promise.all([listarEquipo(comunidadId), esSuperadmin ? listarInvitaciones(comunidadId) : []])
      .then(([eq, inv]) => {
        setEquipo(eq);
        setInvitaciones(inv);
      })
      .catch(() => addToast('No se pudo cargar el equipo.', 'error'))
      .finally(() => setCargando(false));
  }, [estado, comunidadId, esSuperadmin, addToast]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  if (estado !== 'activo') {
    return (
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <EmptyState icon={ShieldCheck} title="Equipo de administración">
          Se habilita con la cuenta conectada a Supabase.
        </EmptyState>
      </section>
    );
  }

  const invitar = async ({ email, rol }) => {
    await crearInvitacion(comunidadId, { email, rol, categorias: rolInfo(rol).categorias });
    addToast(`Invitación enviada a ${email}.`, 'success');
    setAbierto(false);
    recargar();
  };

  const revocar = async (inv) => {
    try {
      await revocarInvitacion(inv.id);
      addToast('Invitación revocada.', 'info');
      recargar();
    } catch {
      addToast('No se pudo revocar.', 'error');
    }
  };

  const quitar = async (m) => {
    if (!window.confirm(`¿Quitar a ${m.nombre} ${m.apellido} del equipo?`)) return;
    try {
      await quitarAdmin(m.membresiaId);
      addToast('Administrador quitado.', 'info');
      recargar();
    } catch {
      addToast('No se pudo quitar.', 'error');
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <SectionTitle
        title="Equipo de administración"
        subtitle={
          esSuperadmin
            ? 'Invitá administradores por email. Se suman al iniciar sesión.'
            : 'Sólo el SuperAdmin puede modificar el equipo.'
        }
        action={
          esSuperadmin && (
            <Button variant="lav" onClick={() => setAbierto(true)}>
              <UserPlus size={16} /> Invitar
            </Button>
          )
        }
      />

      {cargando && equipo.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-ink-faint">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </p>
      )}

      <div className="space-y-2">
        {equipo.map((m) => {
          const info = rolInfo(m.rol);
          const Icon = info.icono;
          const soyYo = m.perfilId === perfil?.id;
          return (
            <div
              key={m.membresiaId}
              className="flex items-center gap-3 rounded-2xl border border-line bg-cloud p-3.5 shadow-card"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lav-soft text-lav">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {m.nombre} {m.apellido}
                  {soyYo && <span className="ml-1 text-xs font-normal text-ink-faint">(vos)</span>}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {m.email} · {info.etiqueta}
                </p>
              </div>
              {esSuperadmin && m.rol !== 'superadmin' && !soyYo && (
                <button
                  onClick={() => quitar(m)}
                  className="rounded-lg p-2 text-crit transition hover:bg-crit-soft"
                  title="Quitar del equipo"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {esSuperadmin && invitaciones.length > 0 && (
        <>
          <p className="mb-2 mt-6 text-[10px] font-extrabold uppercase tracking-widest text-ink-faint">
            Invitaciones pendientes
          </p>
          <div className="space-y-2">
            {invitaciones.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-paper p-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-ink-faint">
                  <Mail size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{inv.email}</p>
                  <p className="text-xs text-ink-soft">
                    {rolInfo(inv.rol).etiqueta} · invitada el{' '}
                    {formatFechaCorta(String(inv.creada_en).slice(0, 10))}
                  </p>
                </div>
                <button
                  onClick={() => revocar(inv)}
                  className="rounded-lg p-2 text-ink-faint transition hover:bg-sand hover:text-crit"
                  title="Revocar invitación"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!cargando && equipo.length === 0 && (
        <EmptyState icon={ShieldCheck} title="Todavía no hay administradores cargados" />
      )}

      <AnimatePresence>
        {abierto && <InvitarModal onInvitar={invitar} onCerrar={() => setAbierto(false)} />}
      </AnimatePresence>
    </section>
  );
}

function InvitarModal({ onInvitar, onCerrar }) {
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('deportes');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Escribí un email válido.');
      return;
    }
    setEnviando(true);
    try {
      await onInvitar({ email: email.trim().toLowerCase(), rol });
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la invitación.');
      setEnviando(false);
    }
  };

  return (
    <Modal
      title="Invitar administrador"
      icon={UserPlus}
      onClose={onCerrar}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="invitar-form"
            variant="lav"
            loading={enviando}
            className="flex-[2]"
          >
            {!enviando && 'Enviar invitación'}
          </Button>
        </>
      }
    >
      <form id="invitar-form" onSubmit={enviar} className="space-y-4 p-5">
        <Field
          label="Email de la persona"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@email.com"
          required
        />
        <div>
          <p className="mb-1.5 text-xs font-bold text-ink-soft">Rol</p>
          <div className="space-y-2">
            {ROLES.map((r) => {
              const Icon = r.icono;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRol(r.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                    rol === r.id ? 'border-lav bg-lav-soft' : 'border-line bg-cloud hover:bg-sand'
                  }`}
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-lav" />
                  <span>
                    <span className="block text-sm font-bold text-ink">{r.etiqueta}</span>
                    <span className="block text-xs text-ink-soft">{r.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="rounded-lg bg-sun-soft px-3 py-2 text-xs text-[#97621b]">
          La persona recibe el acceso automáticamente la próxima vez que inicie sesión con ese
          email. Todavía no se envía un email de aviso.
        </p>
        {error && (
          <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
