import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import {
  ingresar,
  registrarse,
  enviarEnlaceMagico,
  recuperarContrasena,
} from '../../lib/authService';
import { useSesion } from '../../store/useSesion';

const LOGO = '/imagenes/nodo_logo.png';

export default function LoginScreen() {
  const entrarModoDemo = useSesion((s) => s.entrarModoDemo);

  const [modo, setModo] = useState('ingresar'); // ingresar | registrarse
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const limpiar = () => {
    setError('');
    setAviso('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    limpiar();
    setCargando(true);
    const fn =
      modo === 'ingresar'
        ? ingresar({ email, password })
        : registrarse({ email, password, nombre, apellido });
    const res = await fn;
    setCargando(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (modo === 'registrarse' && res.necesitaConfirmacion) {
      setAviso('Te enviamos un email para confirmar la cuenta. Revisá tu bandeja.');
      setModo('ingresar');
    }
    // Si hay sesión, useSesion la toma por onAuthStateChange y cambia de pantalla.
  };

  const onEnlaceMagico = async () => {
    limpiar();
    if (!email) return setError('Escribí tu email primero.');
    setCargando(true);
    const res = await enviarEnlaceMagico({ email });
    setCargando(false);
    res.ok ? setAviso('Te enviamos un enlace de acceso al email.') : setError(res.error);
  };

  const onRecuperar = async () => {
    limpiar();
    if (!email) return setError('Escribí tu email para recuperar la contraseña.');
    setCargando(true);
    const res = await recuperarContrasena({ email });
    setCargando(false);
    res.ok ? setAviso('Te enviamos un email para restablecer la contraseña.') : setError(res.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-nodo-navy px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={LOGO} alt="NODO" className="mb-3 h-14 w-14 rounded-2xl" />
          <h1 className="text-xl font-extrabold tracking-tight text-white">NODO</h1>
          <p className="text-sm text-slate-400">Experiencia digital para comunidades</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lift ring-1 ring-white/10">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-nodo-surface p-1">
            {[
              { key: 'ingresar', label: 'Ingresar' },
              { key: 'registrarse', label: 'Crear cuenta' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setModo(t.key);
                  limpiar();
                }}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  modo === t.key ? 'bg-white text-nodo-navy shadow-card' : 'text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {modo === 'registrarse' && (
              <div className="grid grid-cols-2 gap-3">
                <Campo
                  icon={User}
                  placeholder="Nombre"
                  value={nombre}
                  onChange={setNombre}
                  autoComplete="given-name"
                />
                <Campo
                  placeholder="Apellido"
                  value={apellido}
                  onChange={setApellido}
                  autoComplete="family-name"
                />
              </div>
            )}
            <Campo
              icon={Mail}
              type="email"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Campo
              icon={Lock}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-nodo-red">
                {error}
              </p>
            )}
            {aviso && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-nodo-green-dark">
                {aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-nodo-navy py-2.5 text-sm font-bold text-white transition hover:bg-nodo-navy-2 disabled:opacity-60"
            >
              {cargando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onEnlaceMagico}
              disabled={cargando}
              className="font-semibold text-nodo-teal hover:underline"
            >
              Enviarme un enlace de acceso
            </button>
            {modo === 'ingresar' && (
              <button
                type="button"
                onClick={onRecuperar}
                disabled={cargando}
                className="text-slate-400 hover:underline"
              >
                Olvidé mi contraseña
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={entrarModoDemo}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
        >
          <Sparkles size={13} /> Explorar en modo demo
        </button>
      </motion.div>
    </div>
  );
}

function Campo({ icon: Icon, onChange, type = 'text', ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      )}
      <input
        {...props}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border-0 bg-nodo-surface py-2.5 pr-3 text-sm text-slate-700 ring-1 ring-inset ring-nodo-border placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nodo-cyan ${
          Icon ? 'pl-9' : 'pl-3'
        }`}
      />
    </div>
  );
}
