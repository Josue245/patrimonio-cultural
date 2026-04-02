import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import { MapPin, Calendar, Globe, ArrowLeft, Edit } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function PatrimonioDetail() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['bien', id],
    queryFn: () => patrimonioApi.obtener(id!).then(r => r.data.data),
    enabled: !!id,
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>
  if (!data)     return <div className="text-center py-20 text-gray-400">No encontrado.</div>

  // Normalizar campos que pueden venir como string u objeto
  const tipo   = typeof data.tipo   === 'object' ? data.tipo.label   : data.tipo
const estado = typeof data.estado === 'object' ? data.estado.label : data.estado
const latitud  = data.ubicacion?.latitud  ?? data.coordenadas?.latitud
const longitud = data.ubicacion?.longitud ?? data.coordenadas?.longitud
const altitud  = data.ubicacion?.altitud  ?? data.coordenadas?.altitud

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/patrimonio" className="btn-secondary py-1.5 px-3">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{data.nombre}</h1>
        {hasRole('administrador') && (
          <Link to={`/patrimonio/${id}/editar`} className="btn-secondary py-1.5 px-3">
            <Edit className="w-4 h-4" /> Editar
          </Link>
        )}
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge bg-andino-100 text-andino-700 capitalize">{tipo}</span>
          <span className="badge bg-gray-100 text-gray-600 capitalize">{estado}</span>
          <span className="badge bg-purple-100 text-purple-700 uppercase">{data.idioma}</span>
        </div>
        <p className="text-gray-700 leading-relaxed mb-6">{data.descripcion}</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-andino-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700">Región geográfica</p>
              <p className="text-gray-500">{data.region_geografica}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-andino-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700">Período histórico</p>
              <p className="text-gray-500">{data.periodo_historico}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-andino-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700">Coordenadas</p>
              <p className="text-gray-500 font-mono text-xs">
                {latitud}, {longitud}
                {altitud && ` · ${altitud}m`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Ubicación en el mapa</h2>
        <div className="bg-andino-50 rounded-lg h-40 flex items-center justify-center text-andino-400 text-sm">
          <MapPin className="w-5 h-5 mr-2" />
          {latitud}, {longitud}
          <span className="ml-2 text-xs">— Ver en <Link to="/mapa" className="underline">mapa completo</Link></span>
        </div>
      </div>
    </div>
  )
}