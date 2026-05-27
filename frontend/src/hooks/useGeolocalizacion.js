// hooks/useGeolocalizacion.js
// ─────────────────────────────────────────────────────────────
// Hook para captura automática de GPS al montar el componente.
// Sigue la arquitectura hexagonal: solo lógica de presentación.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

// Opciones de alta precisión para trabajo de campo
const OPCIONES_GPS = {
  enableHighAccuracy: true,   // Usa GPS del hardware, no solo red/wifi
  timeout: 15000,             // 15 seg máximo de espera
  maximumAge: 0,              // Sin cache: siempre posición fresca
};

export const ESTADO_GPS = {
  INACTIVO:   'INACTIVO',
  BUSCANDO:   'BUSCANDO',
  OBTENIDO:   'OBTENIDO',
  ERROR:      'ERROR',
  NO_SOPORTA: 'NO_SOPORTA',
};

/**
 * @returns {{
 *   coordenadas: { latitud: number, longitud: number, altitud: number|null, precision: number } | null,
 *   estado: string,
 *   error: string | null,
 *   activarGPS: () => void,
 *   refrescarPosicion: () => void,
 * }}
 */
export function useGeolocalizacion() {
  const [coordenadas, setCoordenadas] = useState(null);
  const [estado, setEstado]           = useState(ESTADO_GPS.INACTIVO);
  const [error, setError]             = useState(null);
  const watchIdRef                    = useRef(null);

  const procesarPosicion = useCallback((posicion) => {
    const { latitude, longitude, altitude, accuracy } = posicion.coords;
    setCoordenadas({
      latitud:  latitude,
      longitud: longitude,
      altitud:  altitude,          // null si el dispositivo no lo soporta
      precision: Math.round(accuracy), // metros de precisión
      timestamp: posicion.timestamp,
    });
    setEstado(ESTADO_GPS.OBTENIDO);
    setError(null);
  }, []);

  const procesarError = useCallback((err) => {
    const mensajes = {
      1: 'Permiso de ubicación denegado. Habilítalo en los ajustes del navegador.',
      2: 'No se pudo obtener la posición. Verifica tu señal GPS.',
      3: 'Tiempo de espera agotado. Intenta en un lugar con mejor señal.',
    };
    setError(mensajes[err.code] || `Error GPS: ${err.message}`);
    setEstado(ESTADO_GPS.ERROR);
  }, []);

  const activarGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado(ESTADO_GPS.NO_SOPORTA);
      setError('Este dispositivo no soporta geolocalización.');
      return;
    }

    setEstado(ESTADO_GPS.BUSCANDO);
    setError(null);

    // watchPosition actualiza la posición si el gestor se mueve en campo
    watchIdRef.current = navigator.geolocation.watchPosition(
      procesarPosicion,
      procesarError,
      OPCIONES_GPS
    );
  }, [procesarPosicion, procesarError]);

  const refrescarPosicion = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    activarGPS();
  }, [activarGPS]);

  // Activación automática al montar (criterio de aceptación: "abre el formulario")
  useEffect(() => {
    activarGPS();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [activarGPS]);

  return { coordenadas, estado, error, activarGPS, refrescarPosicion };
}
