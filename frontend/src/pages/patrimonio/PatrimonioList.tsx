import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import type { BienCultural, FiltrosBusqueda } from '@/types'
import { MapPin, Eye, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const TIPOS = ['', 'arqueologico', 'inmaterial', 'documental', 'arquitectonico', 'natural']
const ESTADOS = ['', 'excelente', 'bueno', 'regular', 'deteriorado', 'critico']

const estadoBadge: Record<string, string> = {
  excelente: 'bg-green-100 text-green-700',
  bueno:     'bg-blue-100 text-blue-700',
  regular:   'bg-yellow-100 text-yellow-700',
  deteriorado:'bg-orange-100 text-orange-700',
  critico:   'bg-red-100 text-red-700',
}

export default function PatrimonioList() {
  const { hasRole } = useAuth()
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({ page: 1, per_page: 12 })

  const { data, isLoading } = useQuery({
    queryKey: ['patrimonio', filtros],
    queryFn: () => patrimonioApi.listar(filtros).then(r => r.data),
  })

  const set = (key: keyof FiltrosBusqueda, val: string | number) =>
    setFiltros(f => ({ ...f, [key]: val, page: 1 }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Patrimonio Cultural</h1>
        {hasRole('administrador') && (
          <Link to="/patrimonio/nuevo" className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo bien
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <input placeholder="Buscar..." className="input w-48"
          onChange={e => set('q', e.target.value)} />
        <select className="input w-44" onChange={e => set('tipo', e.target.value)}>
          {TIPOS.map(t => <option key={t} value={t}>{t || 'Todos los tipos'}</option>)}
        </select>
        <select className="input w-44" onChange={e => set('estado', e.target.value)}>
          {ESTADOS.map(s => <option key={s} value={s}>{s || 'Todos los estados'}</option>)}
        </select>
        <input placeholder="Región..." className="input w-36"
          onChange={e => set('region', e.target.value)} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data?.data ?? []).map((bien: BienCultural) => (
              <div key={bien.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-andino-100 h-2" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{bien.nombre}</h3>
                    <span className={`badge whitespace-nowrap ${estadoBadge[bien.estado?.codigo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {bien.estado?.codigo}
                    </span>
                  </div>
                  <p className="text-xs text-andino-600 font-medium mb-2 capitalize">{bien.tipo?.label}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{bien.descripcion}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {bien.region_geografica}
                    </span>
                    <Link to={`/patrimonio/${bien.id}`}
                      className="flex items-center gap-1 text-andino-600 hover:text-andino-800 font-medium">
                      <Eye className="w-3 h-3" /> Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button disabled={filtros.page === 1} onClick={() => set('page', (filtros.page ?? 1) - 1)}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Página {data.meta.current_page} de {data.meta.last_page}
              </span>
              <button disabled={filtros.page === data.meta.last_page}
                onClick={() => set('page', (filtros.page ?? 1) + 1)}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
