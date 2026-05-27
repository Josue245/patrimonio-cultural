// services/registroMovilService.js
// ─────────────────────────────────────────────────────────────
// Puerto de salida (Driven Port) — Adaptador HTTP para la API
// de registro móvil. Sigue la arquitectura hexagonal:
// la lógica de negocio no sabe que existe HTTP.
// ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Construye los headers con el token JWT del usuario autenticado.
 */
function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
}

/**
 * Guarda el registro completo (metadatos + multimedia) como multipart/form-data.
 * Envía fotos y audios en un solo request para atomicidad.
 *
 * @param {object} datos - Datos del formulario de registro
 * @param {File[]} fotos - Archivos de imagen capturados
 * @param {Blob[]} audios - Blobs de audio grabados
 * @param {string} token - JWT del gestor autenticado
 * @param {function} onProgreso - Callback(porcentaje: number)
 */
export async function crearRegistroMovil({ datos, fotos, audios, token, onProgreso }) {
  const formData = new FormData();

  // ── Metadatos del bien cultural ──────────────────────────
  formData.append('nombre',           datos.nombre);
  formData.append('descripcion',      datos.descripcion);
  formData.append('tipo',             datos.tipo);
  formData.append('estado_conservacion', datos.estadoConservacion);
  formData.append('latitud',          datos.coordenadas?.latitud  ?? '');
  formData.append('longitud',         datos.coordenadas?.longitud ?? '');
  formData.append('altitud',          datos.coordenadas?.altitud  ?? '');
  formData.append('precision_gps',    datos.coordenadas?.precision ?? '');
  formData.append('origen_movil',     'true');

  if (datos.comunidad)   formData.append('comunidad',   datos.comunidad);
  if (datos.distrito)    formData.append('distrito',    datos.distrito);
  if (datos.provincia)   formData.append('provincia',   datos.provincia);
  if (datos.observaciones) formData.append('observaciones', datos.observaciones);

  // ── Fotos adjuntas ───────────────────────────────────────
  fotos.forEach((foto, idx) => {
    formData.append(`fotos[${idx}]`, foto.file, foto.nombre);
  });

  // ── Audios adjuntos ──────────────────────────────────────
  audios.forEach((audio, idx) => {
    formData.append(`audios[${idx}]`, audio.blob, audio.nombre);
    formData.append(`audios_duracion[${idx}]`, audio.duracion);
  });

  // ── Envío con seguimiento de progreso vía XHR ────────────
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgreso) {
        onProgreso(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    try {
      resolve(JSON.parse(xhr.responseText));
    } catch {
      resolve({ ok: true });
    }
  } else {
    let error = { message: `Error HTTP ${xhr.status}` };
    try { 
      const parsed = JSON.parse(xhr.responseText);
      error.message = parsed.message || JSON.stringify(parsed.errors) || `Error HTTP ${xhr.status}`;
    } catch {}
    reject(error);
  }
});
    xhr.addEventListener('error', () => {
      reject({ message: 'Sin conexión. El registro se guardará localmente.' });
    });

    xhr.open('POST', `${BASE_URL}/bienes-culturales/movil`);
    Object.entries(getAuthHeaders(token)).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.send(formData);
  });
}

/**
 * Obtiene los tipos de bienes culturales para el selector del formulario.
 */
export async function obtenerTiposBien(token) {
  const res = await fetch(`${BASE_URL}/bienes-culturales/tipos`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudieron cargar los tipos de bien.');
  return res.json();
}

/**
 * Obtiene los registros del gestor actual (para historial en campo).
 */
export async function obtenerMisRegistros(token, pagina = 1) {
  const res = await fetch(`${BASE_URL}/bienes-culturales?mis_registros=1&page=${pagina}`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudieron cargar los registros.');
  return res.json();
}

/**
 * Guarda el registro en IndexedDB cuando no hay conexión.
 * El Service Worker lo sincronizará automáticamente.
 */
export async function guardarRegistroOffline({ datos, token }) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('patrimonio-offline-db', 1);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('registros-pendientes')) {
        db.createObjectStore('registros-pendientes', { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('registros-pendientes', 'readwrite');
      tx.objectStore('registros-pendientes').add({ data: datos, token, timestamp: Date.now() });
      tx.oncomplete = () => resolve({ queued: true });
      tx.onerror    = () => reject(tx.error);
    };

    req.onerror = () => reject(req.error);
  });
}
