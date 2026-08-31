/* Generador de QR real y escaneable usando la librería `qrcode`.
   El carnet y los pases de reserva usan este componente para que el código
   pueda leerse con el escáner de acceso (useQrScanner). */

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const LOGO = '/imagenes/nodo_logo.png';

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el logo.'));
    img.src = src;
    img.crossOrigin = 'anonymous';
  });
}

function roundedRectPath(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dibujarConLogo(canvas, img) {
  const ctx = canvas.getContext('2d');
  const lado = Math.round(canvas.width * 0.2);
  const x = (canvas.width - lado) / 2;
  const y = (canvas.height - lado) / 2;
  const radio = lado * 0.28;

  ctx.save();
  roundedRectPath(ctx, x - 2, y - 2, lado + 4, lado + 4, radio);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  const ins = lado * 0.16;
  ctx.save();
  roundedRectPath(ctx, x + ins, y + ins, lado - ins * 2, lado - ins * 2, (radio * 2) / 3);
  ctx.clip();
  ctx.drawImage(img, x + ins, y + ins, lado - ins * 2, lado - ins * 2);
  ctx.restore();
}

function QrCanvas({
  value,
  size = 168,
  color = '#0F172A',
  bg = '#FFFFFF',
  logo = LOGO,
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelado = false;
    const canvas = ref.current;
    if (!canvas || !value) return undefined;

    QRCode.toCanvas(canvas, value, {
      errorCorrectionLevel: 'H',
      margin: logo ? 1 : 2,
      width: size,
      color: { dark: color, light: bg },
    })
      .then(() => (logo ? cargarImagen(logo) : null))
      .then((img) => {
        if (!cancelado && img) dibujarConLogo(canvas, img);
      })
      .catch(() => {
        /* si falla la generación, el canvas queda en blanco */
      });

    return () => {
      cancelado = true;
    };
  }, [value, size, color, bg, logo]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      role="img"
      aria-label="Código QR del carnet"
      className={className}
    />
  );
}

export function QrCode(props) {
  return <QrCanvas {...props} />;
}

export function QrSvg(props) {
  /* Se mantiene el nombre original para compatibilidad con pases de reserva. */
  return <QrCanvas {...props} />;
}
