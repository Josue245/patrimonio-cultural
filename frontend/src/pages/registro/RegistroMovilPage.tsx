// pages/registro/RegistroMovilPage.tsx

import { useState, useCallback, useEffect } from 'react';
import { useGeolocalizacion, ESTADO_GPS }       from '../../hooks/useGeolocalizacion';
import { useCamaraFoto }                         from '../../hooks/useCamaraFoto';
import { useGrabadorAudio, formatearDuracion,
         ESTADO_GRABACION }                      from '../../hooks/useGrabadorAudio';
import { crearRegistroMovil, guardarRegistroOffline } from '../../services/registroMovilService';

const TIPOS_BIEN = [
  { label: 'Arquitectónico', value: 'arquitectonico' },
  { label: 'Arqueológico',   value: 'arqueologico' },
  { label: 'Natural',        value: 'natural' },
  { label: 'Documental',     value: 'documental' },
  { label: 'Inmaterial',     value: 'inmaterial' },
];

const ESTADOS_CONSERVACION = [
  { label: 'Excelente',   value: 'excelente' },
  { label: 'Bueno',       value: 'bueno' },
  { label: 'Regular',     value: 'regular' },
  { label: 'Deteriorado', value: 'deteriorado' },
  { label: 'Crítico',     value: 'critico' },
];

export default function RegistroMovilPage() {
  const token = localStorage.getItem('access_token') || '';

  const gps    = useGeolocalizacion();
  const camara = useCamaraFoto();
  const audio  = useGrabadorAudio();

  const [form, setForm] = useState({
    nombre:            '',
    descripcion:       '',
    tipo:              '',
    estadoConservacion:'',
    comunidad:         '',
    distrito:          '',
    provincia:         'Huancayo',
    observaciones:     '',
  });

  const [enviando, setEnviando]     = useState(false);
  const [progreso, setProgreso]     = useState(0);
  const [exito, setExito]           = useState<any>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [paso, setPaso]             = useState(1);

  const actualizarCampo = useCallback((campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setEnviando(true);
    setErrorEnvio(null);
    setProgreso(0);

    const datosCompletos = { ...form, coordenadas: gps.coordenadas };

    try {
      const resultado = await crearRegistroMovil({
        datos:      datosCompletos,
        fotos:      camara.fotos,
        audios:     audio.audios,
        token,
        onProgreso: setProgreso,
      });
      setExito(resultado);
      setForm({
        nombre:'', descripcion:'', tipo:'', estadoConservacion:'',
        comunidad:'', distrito:'', provincia:'Huancayo', observaciones:'',
      });
      camara.limpiarFotos();
      audio.limpiarAudios();
      setPaso(1);
    } catch (err: any) {
  if (!navigator.onLine) {
    await guardarRegistroOffline({ datos: datosCompletos, token });
    setExito({ queued: true });
  } else {
    setErrorEnvio(err.message || JSON.stringify(err) || 'Error al enviar.');
  }
}
 finally {
      setEnviando(false);
    }
  }, [form, gps.coordenadas, camara, audio, token]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.warn);
    }
  }, []);

  if (exito) return <PantallaExito exito={exito} onNuevo={() => setExito(null)} />;

  return (
    <div style={estilos.root as any}>
      <header style={estilos.header as any}>
        <div style={estilos.headerInner as any}>
          <span style={estilos.logoMarca}>◆ PATRIMONIO</span>
          <span style={estilos.logoRegion}>Junín · Campo</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <IndiceConexion />
          <ChipGPS gps={gps} />
        </div>
      </header>

      <BarraPasos paso={paso} />

      <main style={estilos.main as any}>
        {paso === 1 && (
          <PasoDatosGenerales form={form} onChange={actualizarCampo} gps={gps} onSiguiente={() => setPaso(2)} />
        )}
        {paso === 2 && (
          <PasoMultimedia camara={camara} audio={audio} onAnterior={() => setPaso(1)} onSiguiente={() => setPaso(3)} />
        )}
        {paso === 3 && (
          <PasoRevision
            form={form} gps={gps} fotos={camara.fotos} audios={audio.audios}
            enviando={enviando} progreso={progreso} errorEnvio={errorEnvio}
            onAnterior={() => setPaso(2)} onEnviar={handleSubmit}
          />
        )}
      </main>
    </div>
  );
}

function ChipGPS({ gps }: any) {
  const iconos: any = {
    [ESTADO_GPS.BUSCANDO]:   { icon: '⟳', color: '#f5a623', texto: 'Buscando…' },
    [ESTADO_GPS.OBTENIDO]:   { icon: '◉', color: '#4caf82', texto: `±${gps.coordenadas?.precision}m` },
    [ESTADO_GPS.ERROR]:      { icon: '✕', color: '#e05c5c', texto: 'Sin GPS' },
    [ESTADO_GPS.NO_SOPORTA]: { icon: '✕', color: '#e05c5c', texto: 'No soportado' },
    [ESTADO_GPS.INACTIVO]:   { icon: '○', color: '#888',    texto: 'GPS' },
  };
  const info = iconos[gps.estado] || iconos[ESTADO_GPS.INACTIVO];
  return (
    <button onClick={gps.refrescarPosicion} style={{ ...estilos.chip, borderColor: info.color, color: info.color } as any}>
      <span style={{ fontSize: 10 }}>{info.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{info.texto}</span>
    </button>
  );
}

function IndiceConexion() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return (
    <div style={{ ...estilos.chip, borderColor: online ? '#4caf82' : '#e05c5c', color: online ? '#4caf82' : '#e05c5c' } as any}>
      <span style={{ fontSize: 10 }}>{online ? '●' : '○'}</span>
      <span style={{ fontSize: 11, fontWeight: 700 }}>{online ? 'En línea' : 'Offline'}</span>
    </div>
  );
}

function BarraPasos({ paso }: { paso: number }) {
  const pasos = ['Datos', 'Multimedia', 'Revisión'];
  return (
    <div style={estilos.barraPasos as any}>
      {pasos.map((nombre, i) => {
        const num = i + 1; const activo = num === paso; const listo = num < paso;
        return (
          <div key={num} style={estilos.pasoItem}>
            <div style={{ ...estilos.pasoCirculo, background: listo ? '#c4622d' : activo ? '#e07b4a' : 'transparent', borderColor: listo || activo ? '#c4622d' : '#444', color: listo || activo ? '#fff' : '#666' } as any}>
              {listo ? '✓' : num}
            </div>
            <span style={{ ...estilos.pasoNombre, color: activo ? '#e07b4a' : listo ? '#c4622d' : '#555' }}>
              {nombre}
            </span>
            {i < pasos.length - 1 && <div style={{ ...estilos.pasoLinea, background: listo ? '#c4622d' : '#2a2a2a' }} />}
          </div>
        );
      })}
    </div>
  );
}

function PasoDatosGenerales({ form, onChange, gps, onSiguiente }: any) {
  const valido = form.nombre && form.tipo && form.estadoConservacion;
  return (
    <section style={estilos.seccion}>
      <h2 style={estilos.tituloSeccion}>Identificación del bien</h2>

      <div style={estilos.tarjetaGPS}>
        <div style={estilos.tarjetaGPSTitle}>
          <span style={{ color: '#c4622d', fontSize: 14 }}>◉</span>
          <span style={estilos.labelCampo}>Ubicación GPS automática</span>
        </div>
        {gps.estado === ESTADO_GPS.OBTENIDO && gps.coordenadas ? (
          <div style={estilos.coordenadasGrid}>
            <CoordItem label="Latitud"   value={gps.coordenadas.latitud.toFixed(7)} />
            <CoordItem label="Longitud"  value={gps.coordenadas.longitud.toFixed(7)} />
            {gps.coordenadas.altitud != null && <CoordItem label="Altitud" value={`${Math.round(gps.coordenadas.altitud)} m.s.n.m.`} />}
            <CoordItem label="Precisión" value={`±${gps.coordenadas.precision} m`} />
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: 13, padding: '8px 0' }}>
            {gps.estado === ESTADO_GPS.BUSCANDO ? '⟳ Obteniendo posición…' : gps.error || 'GPS inactivo'}
          </div>
        )}
      </div>

      <Campo label="Nombre del bien" requerido>
        <input style={estilos.input as any} placeholder="Ej. Templo colonial de San Jerónimo" value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} maxLength={200} />
      </Campo>

      <Campo label="Tipo de bien" requerido>
        <select style={estilos.input as any} value={form.tipo} onChange={(e) => onChange('tipo', e.target.value)}>
          <option value="">— Selecciona el tipo —</option>
          {TIPOS_BIEN.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Campo>

      <Campo label="Estado de conservación" requerido>
        <select style={estilos.input as any} value={form.estadoConservacion} onChange={(e) => onChange('estadoConservacion', e.target.value)}>
          <option value="">— Selecciona el estado —</option>
          {ESTADOS_CONSERVACION.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </Campo>

      <Campo label="Descripción" requerido={false}>
        <textarea style={{ ...estilos.input, minHeight: 90, resize: 'vertical' } as any} placeholder="Describe el bien cultural…" value={form.descripcion} onChange={(e) => onChange('descripcion', e.target.value)} maxLength={2000} />
      </Campo>

      <h3 style={estilos.subtitulo}>Ubicación administrativa</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="Comunidad" requerido={false}><input style={estilos.input as any} placeholder="Ej. San Pedro de Cajas" value={form.comunidad} onChange={(e) => onChange('comunidad', e.target.value)} /></Campo>
        <Campo label="Distrito" requerido={false}><input style={estilos.input as any} placeholder="Ej. Tarma" value={form.distrito} onChange={(e) => onChange('distrito', e.target.value)} /></Campo>
      </div>
      <Campo label="Provincia" requerido={false}><input style={estilos.input as any} value={form.provincia} onChange={(e) => onChange('provincia', e.target.value)} /></Campo>

      <BtnPrimario onClick={onSiguiente} disabled={!valido} style={{ marginTop: 24 }}>
        Continuar → Multimedia
      </BtnPrimario>
    </section>
  );
}

function PasoMultimedia({ camara, audio, onAnterior, onSiguiente }: any) {
  const grabando = audio.estado === ESTADO_GRABACION.GRABANDO;
  const pausado  = audio.estado === ESTADO_GRABACION.PAUSADO;
  return (
    <section style={estilos.seccion}>
      <div style={estilos.bloqueMultimedia}>
        <div style={estilos.bloqueHeader}>
          <span style={estilos.bloqueIcon}>📷</span>
          <div>
            <h3 style={estilos.tituloSeccion}>Fotografías</h3>
            <p style={estilos.subtexto}>{camara.fotos.length}/{camara.maxFotos} capturas</p>
          </div>
        </div>
        <input ref={camara.inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={camara.onInputChange} />
        {camara.fotos.length > 0 && (
          <div style={estilos.gridFotos}>
            {camara.fotos.map((foto: any) => (
              <div key={foto.id} style={estilos.celdaFoto as any}>
                <img src={foto.preview} alt="Captura" style={estilos.imgFoto as any} />
                <button onClick={() => camara.eliminarFoto(foto.id)} style={estilos.btnEliminarFoto as any} aria-label="Eliminar foto">✕</button>
              </div>
            ))}
          </div>
        )}
        {camara.errorFoto && <MsgError>{camara.errorFoto}</MsgError>}
        <BtnCaptura onClick={camara.abrirCamara} disabled={camara.capturandoFoto || camara.fotos.length >= camara.maxFotos} cargando={camara.capturandoFoto} style={{}}>
          {camara.capturandoFoto ? 'Procesando…' : '◎ Capturar foto'}
        </BtnCaptura>
      </div>

      <div style={estilos.bloqueMultimedia}>
        <div style={estilos.bloqueHeader}>
          <span style={estilos.bloqueIcon}>🎙</span>
          <div>
            <h3 style={estilos.tituloSeccion}>Testimonios de voz</h3>
            <p style={estilos.subtexto}>{audio.audios.length}/{audio.maxAudios} grabaciones</p>
          </div>
        </div>
        {(grabando || pausado) && (
          <div style={estilos.panelGrabacion}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={estilos.puntoRojo as any} />
              <span style={{ color: '#e5d5c8', fontFamily: 'monospace', fontSize: 22, fontWeight: 700 }}>{formatearDuracion(audio.duracionActual)}</span>
              <span style={{ color: '#888', fontSize: 12 }}>/ {formatearDuracion(audio.maxDuracion)}</span>
            </div>
            <div style={estilos.barraVolumenContenedor}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ ...estilos.barraVolumenSeg, background: i < Math.round(audio.nivelVolumen / 5) ? (i < 14 ? '#c4622d' : '#e05c5c') : '#2a2a2a' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={grabando ? audio.pausarGrabacion : audio.reanudarGrabacion} style={estilos.btnSecundario as any}>
                {grabando ? '⏸ Pausar' : '▶ Reanudar'}
              </button>
              <BtnCaptura onClick={audio.detenerGrabacion} disabled={false} cargando={false} style={{ flex: 1 }}>⏹ Finalizar grabación</BtnCaptura>
            </div>
          </div>
        )}
        {audio.audios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 12 }}>
            {audio.audios.map((a: any, idx: number) => (
              <div key={a.id} style={estilos.itemAudio}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e5d5c8', fontSize: 13, margin: 0 }}>Testimonio {idx + 1}</p>
                  <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{formatearDuracion(a.duracion)} · {(a.tamano / 1024).toFixed(0)} KB</p>
                  <audio controls src={a.url} style={estilos.audioPlayer} />
                </div>
                <button onClick={() => audio.eliminarAudio(a.id)} style={estilos.btnEliminarFoto as any} aria-label="Eliminar">✕</button>
              </div>
            ))}
          </div>
        )}
        {audio.errorAudio && <MsgError>{audio.errorAudio}</MsgError>}
        {!grabando && !pausado && (
          <BtnCaptura onClick={audio.iniciarGrabacion} disabled={audio.audios.length >= audio.maxAudios} cargando={false} style={{}}>
            ● Iniciar grabación
          </BtnCaptura>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={onAnterior} style={estilos.btnSecundario as any}>← Atrás</button>
        <BtnPrimario onClick={onSiguiente} disabled={false} style={{ flex: 1 }}>Revisar registro →</BtnPrimario>
      </div>
    </section>
  );
}

function PasoRevision({ form, gps, fotos, audios, enviando, progreso, errorEnvio, onAnterior, onEnviar }: any) {
  return (
    <section style={estilos.seccion}>
      <h2 style={estilos.tituloSeccion}>Revisión del registro</h2>
      <div style={estilos.tarjetaRevision}>
        <FilaRevision label="Nombre"    value={form.nombre} />
        <FilaRevision label="Tipo"      value={TIPOS_BIEN.find(t => t.value === form.tipo)?.label || form.tipo} />
        <FilaRevision label="Estado"    value={ESTADOS_CONSERVACION.find(e => e.value === form.estadoConservacion)?.label || form.estadoConservacion} />
        {form.comunidad && <FilaRevision label="Comunidad" value={form.comunidad} />}
        {form.distrito  && <FilaRevision label="Distrito"  value={form.distrito} />}
        <FilaRevision label="Provincia" value={form.provincia} />
      </div>
      {gps.coordenadas && (
        <div style={estilos.tarjetaGPS}>
          <div style={estilos.tarjetaGPSTitle}>
            <span style={{ color: '#c4622d' }}>◉</span>
            <span style={estilos.labelCampo}>GPS capturado</span>
          </div>
          <p style={{ color: '#a08070', fontSize: 12, margin: 0 }}>
            {gps.coordenadas.latitud.toFixed(7)}, {gps.coordenadas.longitud.toFixed(7)}
            {gps.coordenadas.altitud != null && ` · ${Math.round(gps.coordenadas.altitud)} m`}
            · ±{gps.coordenadas.precision} m
          </p>
        </div>
      )}
      <div style={estilos.resumenMedia}>
        <div style={estilos.resumenItem as any}>
          <span style={estilos.resumenNum}>{fotos.length}</span>
          <span style={estilos.subtexto}>foto{fotos.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ width: 1, background: '#2a2a2a' }} />
        <div style={estilos.resumenItem as any}>
          <span style={estilos.resumenNum}>{audios.length}</span>
          <span style={estilos.subtexto}>audio{audios.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      {enviando && (
        <div style={estilos.barraProgreso as any}>
          <div style={{ ...estilos.barraProgresoInner, width: `${progreso}%` } as any} />
          <span style={estilos.progresoTexto as any}>{progreso}%</span>
        </div>
      )}
      {errorEnvio && <MsgError>{errorEnvio}</MsgError>}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={onAnterior} style={estilos.btnSecundario as any} disabled={enviando}>← Atrás</button>
        <BtnPrimario onClick={onEnviar} disabled={enviando} style={{ flex: 1 }}>
          {enviando ? `Enviando ${progreso}%…` : '✓ Registrar bien cultural'}
        </BtnPrimario>
      </div>
    </section>
  );
}

function PantallaExito({ exito, onNuevo }: any) {
  return (
    <div style={{ ...estilos.root, justifyContent: 'center', alignItems: 'center', padding: 32 } as any}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{exito.queued ? '📡' : '✓'}</div>
        <h2 style={{ ...estilos.tituloSeccion, fontSize: 20, marginBottom: 12 }}>
          {exito.queued ? 'Guardado sin conexión' : '¡Bien cultural registrado!'}
        </h2>
        <p style={{ color: '#a08070', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {exito.queued
            ? 'El registro se guardó localmente y se sincronizará automáticamente cuando haya conexión.'
            : `El bien cultural fue registrado exitosamente${exito.data?.id ? ` (ID: ${exito.data.id})` : ''}.`
          }
        </p>
        <BtnPrimario onClick={onNuevo} disabled={false} style={{}}>+ Nuevo registro</BtnPrimario>
      </div>
    </div>
  );
}

function Campo({ label, requerido, children }: { label: string; requerido: boolean; children: any }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={estilos.labelCampo}>
        {label}{requerido && <span style={{ color: '#c4622d' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function CoordItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: '#666', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
      <p style={{ color: '#e5d5c8', fontSize: 13, margin: 0, fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function FilaRevision({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#666', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#e5d5c8', fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

function MsgError({ children }: { children: any }) {
  return (
    <div style={{ background: '#2a1010', border: '1px solid #6b2020', borderRadius: 8, padding: '10px 14px', color: '#e05c5c', fontSize: 13, marginBottom: 10 }}>
      ⚠ {children}
    </div>
  );
}

function BtnPrimario({ children, onClick, disabled, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '16px 20px', background: disabled ? '#2a1a10' : '#c4622d', color: disabled ? '#555' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'Lato, sans-serif', letterSpacing: 0.5, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  );
}

function BtnCaptura({ children, onClick, disabled, cargando, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: `2px solid ${disabled ? '#333' : '#c4622d'}`, color: disabled ? '#444' : '#c4622d', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'Lato, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  );
}

const estilos = {
  root:        { minHeight: '100dvh', background: '#0e0907', color: '#e5d5c8', fontFamily: "'Lato', 'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column' },
  header:      { background: '#120c08', borderBottom: '1px solid #2a1a10', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { display: 'flex', flexDirection: 'column' },
  logoMarca:   { color: '#c4622d', fontSize: 13, fontWeight: 900, letterSpacing: 2 },
  logoRegion:  { color: '#604030', fontSize: 11, letterSpacing: 1 },
  chip:        { display: 'flex', alignItems: 'center', gap: 4, border: '1px solid', borderRadius: 20, padding: '4px 8px', background: 'transparent', cursor: 'pointer', fontFamily: 'Lato, sans-serif' },
  barraPasos:  { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 24px', gap: 0, background: '#120c08', borderBottom: '1px solid #1a1a1a' },
  pasoItem:    { display: 'flex', alignItems: 'center', gap: 6 },
  pasoCirculo: { width: 28, height: 28, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  pasoNombre:  { fontSize: 11, fontWeight: 600, letterSpacing: 0.5 },
  pasoLinea:   { width: 32, height: 2, margin: '0 6px' },
  main:        { flex: 1, overflowY: 'auto', padding: '0 0 32px' },
  seccion:     { padding: '20px 18px', maxWidth: 540, margin: '0 auto', width: '100%' },
  tituloSeccion: { color: '#e5d5c8', fontSize: 17, fontWeight: 800, margin: '0 0 16px', letterSpacing: 0.3 },
  subtitulo:   { color: '#a08070', fontSize: 14, fontWeight: 700, margin: '20px 0 12px', letterSpacing: 0.5 },
  subtexto:    { color: '#666', fontSize: 12, margin: 0 },
  labelCampo:  { display: 'block', color: '#a08070', fontSize: 12, fontWeight: 700, marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' },
  input:       { width: '100%', background: '#1a1209', border: '1.5px solid #2a1a10', borderRadius: 10, padding: '12px 14px', color: '#e5d5c8', fontSize: 15, fontFamily: 'Lato, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  tarjetaGPS:  { background: '#130e09', border: '1.5px solid #2a1a10', borderRadius: 12, padding: 14, marginBottom: 20 },
  tarjetaGPSTitle: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  coordenadasGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' },
  bloqueMultimedia: { background: '#130e09', border: '1.5px solid #2a1a10', borderRadius: 16, padding: 18, marginBottom: 16 },
  bloqueHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  bloqueIcon:  { fontSize: 28 },
  gridFotos:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 },
  celdaFoto:   { position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1' },
  imgFoto:     { width: '100%', height: '100%', objectFit: 'cover' },
  btnEliminarFoto: { position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#e05c5c', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  panelGrabacion: { background: '#1a0f0a', border: '1.5px solid #4a2010', borderRadius: 12, padding: 14, marginBottom: 12 },
  puntoRojo:   { width: 10, height: 10, borderRadius: '50%', background: '#e05c5c', display: 'inline-block', animation: 'parpadeo 1s infinite' },
  barraVolumenContenedor: { display: 'flex', gap: 3, alignItems: 'flex-end', height: 24 },
  barraVolumenSeg: { flex: 1, height: '100%', borderRadius: 2, transition: 'background 0.1s' },
  itemAudio:   { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#1a1209', borderRadius: 10, padding: 12 },
  audioPlayer: { width: '100%', marginTop: 6, height: 32 },
  tarjetaRevision: { background: '#130e09', border: '1.5px solid #2a1a10', borderRadius: 12, padding: '4px 14px', marginBottom: 14 },
  resumenMedia: { display: 'flex', background: '#130e09', border: '1.5px solid #2a1a10', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  resumenItem:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0' },
  resumenNum:   { color: '#c4622d', fontSize: 28, fontWeight: 900 },
  barraProgreso: { position: 'relative', background: '#1a1209', borderRadius: 8, overflow: 'hidden', height: 36, marginBottom: 12, border: '1px solid #2a1a10' },
  barraProgresoInner: { position: 'absolute', top: 0, left: 0, bottom: 0, background: '#c4622d', transition: 'width 0.3s' },
  progresoTexto: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, zIndex: 1 },
  btnSecundario: { padding: '14px 20px', background: 'transparent', border: '1.5px solid #2a1a10', color: '#a08070', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'Lato, sans-serif', cursor: 'pointer' },
};
