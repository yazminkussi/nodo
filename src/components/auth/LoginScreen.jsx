import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import {
  ingresar,
  registrarse,
  enviarEnlaceMagico,
  recuperarContrasena,
} from '../../lib/authService';
import { useSesion } from '../../store/useSesion';
import Button from '../ui/Button';
import Field from '../ui/Field';
import NodoMark from '../ui/NodoMark';

export default function LoginScreen() {
  const entrarModoDemo = useSesion((s) => s.entrarModoDemo);

  const [modo, setModo] = useState('ingresar');
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
    const res = await (modo === 'ingresar'
      ? ingresar({ email, password })
      : registrarse({ email, password, nombre, apellido }));
    setCargando(false);
    if (!res.ok) return setError(res.error);
    if (modo === 'registrarse' && res.necesitaConfirmacion) {
      setAviso('Te enviamos un email para confirmar la cuenta. Revisá tu bandeja.');
      setModo('ingresar');
    }
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lav-deep px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-sun/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-lav/25 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center text-cream">
          <NodoMark size={56} tone="light" className="mb-2" />
          <h1 className="font-display text-3xl font-bold lowercase tracking-tight">nodo</h1>
          <p className="text-sm text-cream/70">Experiencia digital para comunidades</p>
        </div>

        <div className="rounded-3xl bg-paper p-6 shadow-lift">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-sand p-1">
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
                className={`relative rounded-lg py-2 text-sm font-bold transition-colors ${
                  modo === t.key ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {modo === t.key && (
                  <motion.span
                    layoutId="login-tab"
                    className="absolute inset-0 -z-10 rounded-lg bg-cloud shadow-card"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {modo === 'registrarse' && (
              <div className="grid grid-cols-2 gap-3">
                <Field
                  icon={User}
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="given-name"
                />
                <Field
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            )}
            <Field
              icon={Mail}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === 'ingresar' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />

            {error && (
              <p className="rounded-lg bg-crit-soft px-3 py-2 text-xs font-semibold text-crit">
                {error}
              </p>
            )}
            {aviso && (
              <p className="rounded-lg bg-ok-soft px-3 py-2 text-xs font-semibold text-ok">
                {aviso}
              </p>
            )}

            <Button
              type="submit"
              variant={modo === 'ingresar' ? 'lav' : 'sun'}
              loading={cargando}
              className="w-full"
            >
              {!cargando && (
                <>
                  {modo === 'ingresar' ? 'Ingresar' : 'Crear cuenta'}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onEnlaceMagico}
              disabled={cargando}
              className="font-semibold text-lav hover:underline"
            >
              Enviarme un enlace de acceso
            </button>
            {modo === 'ingresar' && (
              <button
                type="button"
                onClick={onRecuperar}
                disabled={cargando}
                className="text-ink-faint hover:underline"
              >
                Olvidé mi contraseña
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={entrarModoDemo}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-semibold text-cream/60 transition hover:text-cream"
        >
          <Sparkles size={13} /> Explorar en modo demo
        </button>
      </motion.div>
    </div>
  );
}
