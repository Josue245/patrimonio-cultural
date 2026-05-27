// hooks/useCamaraFoto.js
// ─────────────────────────────────────────────────────────────
// Hook para captura de fotos desde la cámara trasera del móvil.
// Genera previsualizaciones en base64 y objetos File para envío.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';

const MAX_FOTOS        = 5;         // Límite por registro
const MAX_TAMANO_MB    = 8;         // Rechaza fotos > 8 MB
const CALIDAD_JPEG     = 0.82;      // Compresión sin pérdida visible
const MAX_DIMENSION_PX = 2048;      // Redimensiona si supera este valor

/**
 * @returns {{
 *   fotos: Array<{ id: string, preview: string, file: File, nombre: string, tamano: number }>,
 *   capturandoFoto: boolean,
 *   errorFoto: string | null,
 *   inputRef: React.RefObject,
 *   abrirCamara: () => void,
 *   eliminarFoto: (id: string) => void,
 *   limpiarFotos: () => void,
 * }}
 */
export function useCamaraFoto() {
  const [fotos, setFotos]               = useState([]);
  const [capturandoFoto, setCapturando] = useState(false);
  const [errorFoto, setErrorFoto]       = useState(null);
  const inputRef                         = useRef(null);

  // Redimensiona la imagen si supera MAX_DIMENSION_PX (canvas offscreen)
  const comprimirImagen = useCallback((file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        if (width <= MAX_DIMENSION_PX && height <= MAX_DIMENSION_PX) {
          resolve(file); // No necesita redimensionar
          return;
        }

        // Mantiene proporción
        const ratio = Math.min(MAX_DIMENSION_PX / width, MAX_DIMENSION_PX / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);

        const canvas = new OffscreenCanvas(width, height);
        const ctx    = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.convertToBlob({ type: 'image/jpeg', quality: CALIDAD_JPEG })
          .then((blob) => {
            const comprimido = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(comprimido);
          });
      };

      img.src = url;
    });
  }, []);

  const procesarArchivo = useCallback(async (file) => {
    setCapturando(true);
    setErrorFoto(null);

    // Validación de tamaño
    if (file.size > MAX_TAMANO_MB * 1024 * 1024) {
      setErrorFoto(`La imagen supera ${MAX_TAMANO_MB} MB. Intenta capturar con menor resolución.`);
      setCapturando(false);
      return;
    }

    // Validación de tipo
    if (!file.type.startsWith('image/')) {
      setErrorFoto('El archivo seleccionado no es una imagen válida.');
      setCapturando(false);
      return;
    }

    try {
      const fileComprimido = await comprimirImagen(file);
      const preview        = await leerComoDataURL(fileComprimido);

      const nueva = {
        id:      crypto.randomUUID(),
        preview,
        file:    fileComprimido,
        nombre:  `foto_${Date.now()}.jpg`,
        tamano:  fileComprimido.size,
        tipo:    'foto',
      };

      setFotos((prev) => {
        if (prev.length >= MAX_FOTOS) {
          setErrorFoto(`Máximo ${MAX_FOTOS} fotos por registro.`);
          return prev;
        }
        return [...prev, nueva];
      });
    } catch (err) {
      setErrorFoto('Error al procesar la imagen. Intenta nuevamente.');
      console.error('[useCamaraFoto]', err);
    } finally {
      setCapturando(false);
    }
  }, [comprimirImagen]);

  // Abre la cámara trasera del dispositivo móvil
  const abrirCamara = useCallback(() => {
    if (fotos.length >= MAX_FOTOS) {
      setErrorFoto(`Máximo ${MAX_FOTOS} fotos por registro.`);
      return;
    }
    inputRef.current?.click();
  }, [fotos.length]);

  const onInputChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await procesarArchivo(file);
    // Resetea el input para permitir capturar la misma foto de nuevo
    e.target.value = '';
  }, [procesarArchivo]);

  const eliminarFoto = useCallback((id) => {
    setFotos((prev) => prev.filter((f) => f.id !== id));
    setErrorFoto(null);
  }, []);

  const limpiarFotos = useCallback(() => {
    setFotos([]);
    setErrorFoto(null);
  }, []);

  return {
    fotos,
    capturandoFoto,
    errorFoto,
    inputRef,
    onInputChange,
    abrirCamara,
    eliminarFoto,
    limpiarFotos,
    maxFotos: MAX_FOTOS,
  };
}

// Utilidad: FileReader como promesa
function leerComoDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
