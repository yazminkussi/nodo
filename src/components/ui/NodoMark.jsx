/* Logo de NODO (glifo de trazo continuo).
   tone:
     'brand'  → indigo original (sobre fondos claros)
     'light'  → blanco / crema (sobre fondos oscuros)
     'ink'    → casi negro
*/

const filtros = {
  brand: 'none',
  light: 'brightness(0) invert(1)',
  ink: 'brightness(0)',
};

export default function NodoMark({ size = 36, tone = 'brand', className = '' }) {
  return (
    <img
      src="/imagenes/nodo_logo.png"
      alt="NODO"
      width={size}
      height={size}
      loading="eager"
      className={`object-contain ${className}`}
      style={{ width: size, height: size, filter: filtros[tone] }}
    />
  );
}
