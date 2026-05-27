// hooks/useGrabadorAudio.js
// ─────────────────────────────────────────────────────────────
// Hook para grabar testimonios y descripciones orales en campo.
// Usa MediaRecorder API con preferencia por WebM/Opus (mejor
// compresión), con fallback a MP4/AAC en iOS Safari.
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_DURACION_SEG = 300;  // 5 minutos máximo por testimonio
const MAX_AUDIOS       = 3;    // Máximo de audios por registro

export const ESTADO_GRABACION = {
  INACTIVO:   'INACTIVO',
  GRABANDO:   'GRABANDO',
  PAUSADO:    'PAUSADO',
  PROCESANDO: 'PROCESANDO',
  LISTO:      'LISTO',
  ERROR:      'ERROR',
};

/**
 * @returns {{
 *   audios: Array<{ id, url, blob, nombre, duracion, tamano }>,
 *   estado: string,
 *   duracionActual: number,
 *   nivelVolumen: number,
 *   errorAudio: string | null,
 *   iniciarGrabacion: () => Promise<void>,
 *   detenerGrabacion: () => void,
 *   pausarGrabacion: () => void,
 *   reanudarGrabacion: () => void,
 *   eliminarAudio: (id: string) => void,
 *   limpiarAudios: () => void,
 * }}
 */
export function useGrabadorAudio() {
  const [audios, setAudios]               = useState([]);
  const [estado, setEstado]               = useState(ESTADO_GRABACION.INACTIVO);
  const [duracionActual, setDuracion]     = useState(0);
  const [nivelVolumen, setNivelVolumen]   = useState(0);
  const [errorAudio, setErrorAudio]       = useState(null);

  const mediaRecorderRef  = useRef(null);
  const chunksRef         = useRef([]);
  const timerRef          = useRef(null);
  const analyserRef       = useRef(null);
  const streamRef         = useRef(null);
  const animFrameRef      = useRef(null);
  const inicioRef         = useRef(null);

  // Detecta el formato soportado por el dispositivo
  const getFormatoSoportado = () => {
    const formatos = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    return formatos.find((f) => MediaRecorder.isTypeSupported(f)) || '';
  };

  // Analiza el nivel de volumen para la barra animada
  const iniciarAnalisisVolumen = useCallback((stream) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx      = new AudioContext();
    const analyser = ctx.createAnalyser();
    const source   = ctx.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const promedio = buffer.reduce((a, b) => a + b, 0) / buffer.length;
      setNivelVolumen(Math.min(100, Math.round(promedio * 2)));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const detenerAnalisisVolumen = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setNivelVolumen(0);
  }, []);

  const iniciarGrabacion = useCallback(async () => {
    if (audios.length >= MAX_AUDIOS) {
      setErrorAudio(`Máximo ${MAX_AUDIOS} audios por registro.`);
      return;
    }

    setErrorAudio(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current  = stream;
      chunksRef.current  = [];

      const formato      = getFormatoSoportado();
      const recorder     = new MediaRecorder(stream, formato ? { mimeType: formato } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setEstado(ESTADO_GRABACION.PROCESANDO);
        detenerAnalisisVolumen();

        const mimeType = recorder.mimeType || 'audio/webm';
        const blob     = new Blob(chunksRef.current, { type: mimeType });
        const url      = URL.createObjectURL(blob);
        const duracion = Math.round((Date.now() - inicioRef.current) / 1000);
        const ext      = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

        const nuevoAudio = {
          id:      crypto.randomUUID(),
          url,
          blob,
          nombre:  `testimonio_${Date.now()}.${ext}`,
          duracion,
          tamano:  blob.size,
          tipo:    'audio',
        };

        setAudios((prev) => [...prev, nuevoAudio]);
        setEstado(ESTADO_GRABACION.LISTO);
        setDuracion(0);

        // Libera el micrófono
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250); // Chunks cada 250ms para mejor manejo de memoria
      inicioRef.current = Date.now();
      setEstado(ESTADO_GRABACION.GRABANDO);
      iniciarAnalisisVolumen(stream);

      // Temporizador de duración
      timerRef.current = setInterval(() => {
        const seg = Math.round((Date.now() - inicioRef.current) / 1000);
        setDuracion(seg);

        // Auto-detiene al llegar al límite
        if (seg >= MAX_DURACION_SEG) {
          detenerGrabacion();
        }
      }, 1000);

    } catch (err) {
      const mensajes = {
        NotAllowedError:  'Permiso de micrófono denegado. Habilítalo en los ajustes.',
        NotFoundError:    'No se encontró micrófono en este dispositivo.',
        NotReadableError: 'El micrófono está siendo usado por otra aplicación.',
      };
      setErrorAudio(mensajes[err.name] || `Error al acceder al micrófono: ${err.message}`);
      setEstado(ESTADO_GRABACION.ERROR);
    }
  }, [audios.length, iniciarAnalisisVolumen, detenerAnalisisVolumen]);

  const detenerGrabacion = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pausarGrabacion = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setEstado(ESTADO_GRABACION.PAUSADO);
      detenerAnalisisVolumen();
    }
  }, [detenerAnalisisVolumen]);

  const reanudarGrabacion = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setEstado(ESTADO_GRABACION.GRABANDO);
      iniciarAnalisisVolumen(streamRef.current);

      timerRef.current = setInterval(() => {
        const seg = Math.round((Date.now() - inicioRef.current) / 1000);
        setDuracion(seg);
        if (seg >= MAX_DURACION_SEG) detenerGrabacion();
      }, 1000);
    }
  }, [iniciarAnalisisVolumen, detenerGrabacion]);

  const eliminarAudio = useCallback((id) => {
    setAudios((prev) => {
      const audio = prev.find((a) => a.id === id);
      if (audio?.url) URL.revokeObjectURL(audio.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const limpiarAudios = useCallback(() => {
    audios.forEach((a) => { if (a.url) URL.revokeObjectURL(a.url); });
    setAudios([]);
    setEstado(ESTADO_GRABACION.INACTIVO);
    setErrorAudio(null);
  }, [audios]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      detenerAnalisisVolumen();
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audios.forEach((a) => { if (a.url) URL.revokeObjectURL(a.url); });
    };
  }, []); // eslint-disable-line

  return {
    audios,
    estado,
    duracionActual,
    nivelVolumen,
    errorAudio,
    iniciarGrabacion,
    detenerGrabacion,
    pausarGrabacion,
    reanudarGrabacion,
    eliminarAudio,
    limpiarAudios,
    maxAudios: MAX_AUDIOS,
    maxDuracion: MAX_DURACION_SEG,
  };
}

// Formatea segundos → "MM:SS"
export function formatearDuracion(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
