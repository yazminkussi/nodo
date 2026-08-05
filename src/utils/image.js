export const FORMATOS_LOGO = ['image/png', 'image/jpeg'];
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_LOGO_LADO = 512;

export function redimensionarLogo(file, ladoMax = MAX_LOGO_LADO) {
  return new Promise((resolve, reject) => {
    if (!FORMATOS_LOGO.includes(file.type)) {
      reject(new Error('Formato no admitido. Usá PNG o JPG.'));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error('El archivo supera los 2 MB. Comprimilo e intentá de nuevo.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const mayor = Math.max(img.width, img.height);
        const escala = mayor > ladoMax ? ladoMax / mayor : 1;
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, 0.92));
      };
      img.onerror = () => reject(new Error('La imagen es inválida o está dañada.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
