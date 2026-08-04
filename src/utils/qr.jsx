/* Generador de QR visual determinístico para el prototipo.
   No es un QR real: produce una matriz estable a partir de un string,
   con los patrones de localización de un QR estándar para que se vea
   y se escanee visualmente como tal en la demo. */

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 25;
const F = 7;

function inFinder(r, c) {
  return (r < F && c < F) || (r < F && c >= SIZE - F) || (r >= SIZE - F && c < F);
}

function finderCell(r, c) {
  const x = r % F;
  const y = c % F;
  if (x === 0 || x === 6 || y === 0 || y === 6) return true;
  return x >= 2 && x <= 4 && y >= 2 && y <= 4;
}

export function generateQrMatrix(payload) {
  const rand = mulberry32(hashString(payload));
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (inFinder(r, c)) {
        grid[r][c] = finderCell(r, c);
      } else {
        grid[r][c] = rand() > 0.48;
      }
    }
  }

  for (let i = 8; i < SIZE - 8; i++) {
    if (!inFinder(6, i)) grid[6][i] = i % 2 === 0;
    if (!inFinder(i, 6)) grid[i][6] = i % 2 === 0;
  }

  return grid;
}

export function QrSvg({ value, size = 168, color = '#0F172A', bg = '#FFFFFF', className = '' }) {
  const grid = generateQrMatrix(value);
  const cell = size / SIZE;
  const rects = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) {
        rects.push(`M${(c * cell).toFixed(2)},${(r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}z`);
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Código QR del carnet"
      className={className}
      style={{ background: bg, borderRadius: 8 }}
    >
      <path d={rects.join('')} fill={color} />
    </svg>
  );
}
