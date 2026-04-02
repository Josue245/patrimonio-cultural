import { useQuery } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import { BarChart2, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['estadisticas'],
    queryFn: () => patrimonioApi.estadisticas().then(r => r.data.data),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>

      {isLoading ? (
        <div className="grid sm:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <BarChart2 className="w-5 h-5 text-andino-600" />
                <h2 className="font-semibold">Por tipo</h2>
              </div>
              {data?.por_tipo?.map((t: any) => (
                <div key={t.tipo} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="capitalize text-gray-600">{t.tipo}</span>
                  <span className="font-medium">{t.total}</span>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-andino-600" />
                <h2 className="font-semibold">Por región</h2>
              </div>
              {data?.por_region?.map((r: any) => (
                <div key={r.region_geografica} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-600">{r.region_geografica}</span>
                  <span className="font-medium">{r.total}</span>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-andino-600" />
                <h2 className="font-semibold">Por estado</h2>
              </div>
              {data?.por_estado?.map((e: any) => (
                <div key={e.estado} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="capitalize text-gray-600">{e.estado}</span>
                  <span className="font-medium">{e.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Acciones rápidas</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/patrimonio/nuevo" className="btn-primary">+ Nuevo bien cultural</Link>
              <Link to="/patrimonio"       className="btn-secondary">Ver catálogo completo</Link>
              <Link to="/mapa"             className="btn-secondary">Ver mapa</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
