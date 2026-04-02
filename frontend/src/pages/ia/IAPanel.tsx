import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useMutation, useQuery } from '@tanstack/react-query'
import { iaApi } from '@/api/ia'
import toast from 'react-hot-toast'
import { Brain, Search, Copy, RefreshCw, CheckCircle, AlertTriangle, Zap } from 'lucide-react'



// ── Helpers ──────────────────────────────────────────────────────────────
const nivelColor: Record<string, string> = {
  alto:  'bg-green-100 text-green-700',
  medio: 'bg-yellow-100 text-yellow-700',
  bajo:  'bg-red-100 text-red-700',
}
const nivelDupColor: Record<string, string> = {
  duplicado:   'bg-red-100 text-red-700 border-red-300',
  sospechoso:  'bg-yellow-100 text-yellow-700 border-yellow-300',
  unico:       'bg-green-100 text-green-700 border-green-300',
}

// ── Tabs ──────────────────────────────────────────────────────────────────
type Tab = 'clasificar' | 'generar' | 'duplicado' | 'buscar'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'clasificar', label: 'Clasificar tipo',       icon: <Brain className="w-4 h-4" /> },
  { id: 'generar',    label: 'Generar descripción',   icon: <Zap className="w-4 h-4" /> },
  { id: 'duplicado',  label: 'Detectar duplicado',    icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'buscar',     label: 'Búsqueda semántica',    icon: <Search className="w-4 h-4" /> },
]

// ── Main Component ────────────────────────────────────────────────────────
export default function IAPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('clasificar')
  const { hasRole } = useAuth()

  const { data: estado } = useQuery({
    queryKey: ['ia-estado'],
    queryFn:  () => iaApi.estado().then(r => r.data.data),
    staleTime: 60_000,
  })

  const tabsVisibles = tabs.filter(tab => {
    if (hasRole('visitante')) {
      return tab.id === 'clasificar' || tab.id === 'buscar'
    }
    return true
  })

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-andino-600" />
            Panel de Inteligencia Artificial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Groq · {estado?.estadisticas?.groq_modelo ?? 'llama3-8b-8192'}
          </p>
        </div>
        <div className={`badge ${estado?.estadisticas?.groq_configurado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {estado?.estadisticas?.groq_configurado ? '● Groq activo' : '○ Fallback local'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabsVisibles.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium flex-1 justify-center transition-all
              ${activeTab === tab.id
                ? 'bg-white text-andino-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 'clasificar' && <ClasificarPanel />}
      {activeTab === 'generar'    && !hasRole('visitante') && <GenerarDescripcionPanel />}
      {activeTab === 'duplicado'  && !hasRole('visitante') && <DetectarDuplicadoPanel key={activeTab} />}
      {activeTab === 'buscar'     && <BusquedaSemanticaPanel />}
    </div>
  )
}

// ── Clasificar Panel ──────────────────────────────────────────────────────
function ClasificarPanel() {
  const [nombre,      setNombre]      = useState('')
  const [descripcion, setDescripcion] = useState('')

  const mutation = useMutation({
    mutationFn: () => iaApi.clasificar(nombre, descripcion).then(r => r.data.data),
    onError: () => toast.error('Error al clasificar. Verifica la conexión.'),
  })

  return (
    <div className="card p-6 space-y-5">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el nombre y descripción de un bien cultural. Groq analizará el contenido
          y sugerirá el tipo de patrimonio más adecuado.
        </p>
        <label className="label">Nombre del bien cultural</label>
        <input className="input" placeholder="Ej: Zona Arqueológica de Huari Vilca"
          value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea rows={4} className="input resize-none"
          placeholder="Describe el bien cultural con el mayor detalle posible..."
          value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>
      <button onClick={() => mutation.mutate()}
        disabled={mutation.isPending || (!nombre && !descripcion)}
        className="btn-primary w-full justify-center">
        {mutation.isPending
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analizando con Groq...</>
          : <><Brain className="w-4 h-4" /> Clasificar patrimonio</>}
      </button>

      {mutation.data && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tipo predicho</p>
              <p className="text-xl font-bold text-andino-700 capitalize">
                {mutation.data.tipo_predicho}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Confianza</p>
              <span className={`badge text-sm font-semibold ${nivelColor[mutation.data.nivel_confianza] ?? 'bg-gray-100 text-gray-600'}`}>
                {(mutation.data.confianza * 100).toFixed(0)}% — {mutation.data.nivel_confianza}
              </span>
            </div>
          </div>

          {mutation.data.justificacion && (
            <div className="bg-andino-50 rounded-md p-3">
              <p className="text-xs font-medium text-andino-700 mb-1">Justificación de Groq</p>
              <p className="text-sm text-gray-700">{mutation.data.justificacion}</p>
            </div>
          )}

          {mutation.data.palabras_clave?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mutation.data.palabras_clave.map((k: string) => (
                <span key={k} className="badge bg-gray-100 text-gray-600">{k}</span>
              ))}
            </div>
          )}

          {mutation.data.probabilidades?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Probabilidades por tipo</p>
              <div className="space-y-1.5">
                {mutation.data.probabilidades.map((p: any) => (
                  <div key={p.tipo} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-28 capitalize">{p.tipo}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-andino-500 h-2 rounded-full transition-all"
                        style={{ width: `${(p.confianza * 100).toFixed(0)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {(p.confianza * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">Fuente: {mutation.data.fuente}</p>
        </div>
      )}
    </div>
  )
}

// ── Generar Descripción Panel ─────────────────────────────────────────────
function GenerarDescripcionPanel() {
  const [form, setForm] = useState({ nombre: '', tipo: '', region_geografica: '', periodo_historico: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => iaApi.generarDescripcion(form).then(r => r.data.data),
    onError: () => toast.error('Error al generar descripción.'),
  })

  const copiar = () => {
    if (mutation.data?.descripcion_generada) {
      navigator.clipboard.writeText(mutation.data.descripcion_generada)
      toast.success('Descripción copiada al portapapeles')
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Groq genera una descripción académica y enriquecida a partir de los datos básicos del bien.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nombre *</label>
          <input className="input" placeholder="Nombre del bien cultural"
            value={form.nombre} onChange={e => set('nombre', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="">Seleccionar...</option>
            {['arqueologico','inmaterial','documental','arquitectonico','natural'].map(t =>
              <option key={t} value={t} className="capitalize">{t}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label">Región geográfica</label>
          <input className="input" placeholder="Ej: Huancayo, Valle del Mantaro"
            value={form.region_geografica} onChange={e => set('region_geografica', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Período histórico</label>
          <input className="input" placeholder="Ej: Horizonte Medio, Colonial, República"
            value={form.periodo_historico} onChange={e => set('periodo_historico', e.target.value)} />
        </div>
      </div>
      <button onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.nombre}
        className="btn-primary w-full justify-center">
        {mutation.isPending
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generando con Groq...</>
          : <><Zap className="w-4 h-4" /> Generar descripción</>}
      </button>

      {mutation.data?.descripcion_generada && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Descripción generada</p>
            <button onClick={copiar} className="btn-secondary py-1 px-2 text-xs">
              <Copy className="w-3 h-3" /> Copiar
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {mutation.data.descripcion_generada}
          </p>
          {mutation.data.palabras_clave?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mutation.data.palabras_clave.map((k: string) =>
                <span key={k} className="badge bg-andino-100 text-andino-700">{k}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Detectar Duplicado Panel ──────────────────────────────────────────────

function DetectarDuplicadoPanel() {
  const [nombre,    setNombre]    = useState('')
  const [region,    setRegion]    = useState('')
  const [desc,      setDesc]      = useState('')
  const [ejecutado, setEjecutado] = useState(false)

  const mutation = useMutation({
    mutationFn: () => iaApi.detectarDuplicado({
      nombre, descripcion: desc, region_geografica: region,
    }).then(r => r.data.data),
    onSuccess: () => setEjecutado(true),
    onError: () => toast.error('Error al verificar duplicados.'),
  })

  useEffect(() => {
    mutation.reset()
    setEjecutado(false)
  }, [])

  const resultado = mutation.data

  return (
    <div className="card p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Verifica si un bien cultural ya existe en el catálogo antes de registrarlo.
        Groq valida semánticamente los candidatos similares.
      </p>
      <div>
        <label className="label">Nombre del bien *</label>
        <input className="input" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del bien que deseas registrar" />
      </div>
      <div>
        <label className="label">Región geográfica</label>
        <input className="input" value={region} onChange={e => setRegion(e.target.value)}
          placeholder="Ej: Huancayo" />
      </div>
      <div>
        <label className="label">Descripción breve</label>
        <textarea rows={2} className="input resize-none" value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Breve descripción para mejorar la detección..." />
      </div>
      <button onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !nombre}
        className="btn-primary w-full justify-center">
        {mutation.isPending
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verificando...</>
          : <><AlertTriangle className="w-4 h-4" /> Verificar duplicado</>}
      </button>

      {ejecutado && resultado && (
        <div className={`border rounded-lg p-4 ${nivelDupColor[resultado.nivel] ?? 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {resultado.es_duplicado
              ? <AlertTriangle className="w-5 h-5" />
              : <CheckCircle className="w-5 h-5" />}
            <span className="font-semibold capitalize">
              {resultado.nivel === 'duplicado'  && 'Duplicado detectado'}
              {resultado.nivel === 'sospechoso' && 'Registro sospechoso — revisar'}
              {resultado.nivel === 'unico'      && 'Sin duplicados detectados'}
            </span>
          </div>
          {resultado.razon_groq && (
            <p className="text-sm mb-3">{resultado.razon_groq}</p>
          )}
          {resultado.similares?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Registros similares encontrados:</p>
              {resultado.similares.map((s: any) => (
                <div key={s.id} className="bg-white bg-opacity-60 rounded p-2 text-xs">
                  <span className="font-medium">{s.nombre}</span>
                  <span className="ml-2 text-gray-500">{s.region}</span>
                  <span className="ml-auto float-right font-mono">
                    {(s.similitud * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs mt-2 opacity-70">Fuente: {resultado.fuente}</p>
        </div>
      )}
    </div>
  )
}

// ── Búsqueda Semántica Panel ──────────────────────────────────────────────
function BusquedaSemanticaPanel() {
  const [query, setQuery]   = useState('')
  const [topK,  setTopK]    = useState(5)

  const mutation = useMutation({
    mutationFn: () => iaApi.similar(query, topK).then(r => r.data.data),
    onError: () => toast.error('Error en búsqueda semántica.'),
  })

  return (
    <div className="card p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Busca bienes culturales usando lenguaje natural. Groq re-rankea los resultados
        por relevancia semántica real, no solo por palabras clave.
      </p>
      <div>
        <label className="label">Consulta en lenguaje natural</label>
        <input className="input"
          placeholder='Ej: "danzas rituales andinas con música tradicional" o "sitios wari con estructuras de piedra"'
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && query.length >= 3 && mutation.mutate()} />
      </div>
      <div className="flex items-center gap-4">
        <label className="label mb-0">Resultados: {topK}</label>
        <input type="range" min={1} max={20} value={topK}
          onChange={e => setTopK(+e.target.value)} className="flex-1" />
      </div>
      <button onClick={() => mutation.mutate()}
        disabled={mutation.isPending || query.length < 3}
        className="btn-primary w-full justify-center">
        {mutation.isPending
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Buscando...</>
          : <><Search className="w-4 h-4" /> Búsqueda semántica</>}
      </button>

      {mutation.data && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              {mutation.data.total} resultado(s) · Fuente: {mutation.data.fuente}
            </p>
          </div>
          <div className="space-y-3">
            {mutation.data.resultados?.map((b: any, i: number) => (
              <div key={b.id ?? i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900">{b.nombre}</p>
                  <span className="badge bg-andino-100 text-andino-700 flex-shrink-0">
                    {((b.relevancia ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-andino-600 capitalize mb-1">
                  {b.tipo?.label ?? b.tipo} · {b.region_geografica}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2">{b.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
