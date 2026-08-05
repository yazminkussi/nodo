import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading2 } from 'lucide-react';

const botones = [
  { cmd: 'bold', arg: null, icon: Bold, titulo: 'Negrita' },
  { cmd: 'italic', arg: null, icon: Italic, titulo: 'Cursiva' },
  { cmd: 'underline', arg: null, icon: Underline, titulo: 'Subrayado' },
  { cmd: 'formatBlock', arg: 'H2', icon: Heading2, titulo: 'Título' },
  { cmd: 'insertUnorderedList', arg: null, icon: List, titulo: 'Lista con viñetas' },
  { cmd: 'insertOrderedList', arg: null, icon: ListOrdered, titulo: 'Lista numerada' },
];

export default function NodoDoc({ item, setItem }) {
  const ref = useRef(null);
  const contenido = typeof item.contenido === 'string' ? item.contenido : '';

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== contenido) {
      ref.current.innerHTML = contenido;
    }
  }, [contenido]);

  const ejecutar = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    setItem({ ...item, contenido: ref.current?.innerHTML ?? '' });
  };

  const onInput = () => setItem({ ...item, contenido: ref.current?.innerHTML ?? '' });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 border-b border-nodo-border pb-3">
        {botones.map(({ cmd, arg, icon: Icon, titulo }) => (
          <button
            key={cmd + (arg || '')}
            type="button"
            title={titulo}
            aria-label={titulo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => ejecutar(cmd, arg)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-nodo-navy"
          >
            <Icon size={16} strokeWidth={2.2} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        className="min-h-[280px] w-full rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-nodo-border focus:outline-none focus:ring-2 focus:ring-nodo-cyan"
        data-placeholder="Escribí el documento…"
      />
      <p className="mt-2 text-[11px] text-slate-400">
        Editor NODO Doc · actas, memorandos y comunicados listos para la comunidad.
      </p>
    </div>
  );
}
