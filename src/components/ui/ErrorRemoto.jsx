import { CloudOff, RefreshCw } from 'lucide-react';
import Button from './Button';

/* Estado de error para las vistas que leen de Supabase.
   `error` puede ser un Error o un string. */
export default function ErrorRemoto({
  error,
  onReintentar,
  titulo = 'No pudimos cargar los datos',
}) {
  const detalle = typeof error === 'string' ? error : error?.message;
  return (
    <div className="rounded-2xl border-2 border-dashed border-crit/40 bg-crit-soft/50 px-6 py-10 text-center">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-crit">
        <CloudOff size={20} />
      </span>
      <p className="font-display text-base font-bold text-ink">{titulo}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
        Puede ser un problema de conexión. Probá de nuevo en un momento.
      </p>
      {detalle && (
        <p className="mx-auto mt-1 max-w-md break-words text-xs text-ink-faint">{detalle}</p>
      )}
      {onReintentar && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onReintentar}>
            <RefreshCw size={14} /> Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
