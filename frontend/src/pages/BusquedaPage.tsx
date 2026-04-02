import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import type { FiltrosBusqueda, BienCultural } from '@/types'
import { Search, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BusquedaPage() {
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({})
  const [buscar, setBuscar]   = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['busqueda', filtros],
    queryFn: () => patrimonioApi.busquedaAvanzada(filtros).then(r => r.data),
    enabled: buscar,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBuscar(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Búsqueda Avanzada</h1>

      <form onSubmit={handleSubmit} className="card p-6 mb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Texto libre</label>
            <input className="input" placeholder="Nombre o descripción..."
              onChange={e => setFiltros(f => ({ ...f, q: e.target.value }))} />
          </div>
          {[
            { label: 'Tipo',   key: 'tipo',   opts: ['','arqueologico','inmaterial','documental','arquitectonico','natural'] },
            { label: 'Estado', key: 'estado', opts: ['','excelente','bueno','regular','deteriorado','critico'] },
            { label: 'Idioma', key: 'idioma', opts: ['','es','qu','ay'] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <select className="input" onChange={e => setFiltros(f => ({ ...f, [key]: e.target.value }))}>
                {opts.map(o => <option key={o} value={o}>{o || `Todos`}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="label">Región</label>
            <input className="input" placeholder="Ej: Huancayo"
              onChange={e => setFiltros(f => ({ ...f, region: e.target.value }))} />
          </div>
          <div>
            <label className="label">Período histórico</label>
            <input className="input" placeholder="Ej: Colonial"
              onChange={e => setFiltros(f => ({ ...f, periodo: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="btn-primary">
          <Search className="w-4 h-4" /> Buscar
        </button>
      </form>

      {isLoading && <p className="text-center text-gray-400 py-10">Buscando...</p>}

      {data && (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.meta?.total ?? 0} resultado(s) encontrado(s)</p>
          <div className="space-y-3">
            {data.data.map((bien: BienCultural) => (
              <Link key={bien.id} to={`/patrimonio/${bien.id}`}
                className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow block">
                <div className="bg-andino-100 text-andino-600 p-2 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{bien.nombre}</h3>
                  <p className="text-xs text-andino-600 capitalize mb-1">{bien.tipo?.label} · {bien.region_geografica}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{bien.descripcion}</p>
                </div>
                <span className="badge bg-gray-100 text-gray-600 capitalize flex-shrink-0">
                  {bien.estado?.codigo}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
