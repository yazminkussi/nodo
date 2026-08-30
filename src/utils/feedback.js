/* Feedback háptico y sonoro para el escáner de acceso.
   - Web Audio API: tonos de aprobación / rechazo generados por osciladores.
   - Navigator Vibration API: patrones cortos según el resultado. */

let audioCtx = null;

function obtenerCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tono(ctx, { freq, inicio = 0, duracion = 0.14, tipo = 'sine', volumen = 0.22 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + inicio);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + inicio);
  gain.gain.exponentialRampToValueAtTime(volumen, ctx.currentTime + inicio + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + duracion);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + inicio);
  osc.stop(ctx.currentTime + inicio + duracion + 0.05);
}

export function sonidoAccesoPermitido() {
  const ctx = obtenerCtx();
  if (!ctx || ctx.state !== 'running') return;
  tono(ctx, { freq: 880, inicio: 0, duracion: 0.12 });
  tono(ctx, { freq: 1174.66, inicio: 0.14, duracion: 0.18 });
}

export function sonidoAccesoDenegado() {
  const ctx = obtenerCtx();
  if (!ctx || ctx.state !== 'running') return;
  tono(ctx, { freq: 220, inicio: 0, duracion: 0.28, tipo: 'square', volumen: 0.16 });
  tono(ctx, { freq: 110, inicio: 0.22, duracion: 0.32, tipo: 'triangle', volumen: 0.2 });
}

export function vibrarPermitido() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([55, 35, 55]);
}

export function vibrarDenegado() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([130, 50, 130]);
}

export function feedbackResultado(tipo) {
  if (tipo === 'permitido') {
    sonidoAccesoPermitido();
    vibrarPermitido();
  } else {
    sonidoAccesoDenegado();
    vibrarDenegado();
  }
}