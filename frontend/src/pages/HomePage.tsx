import { Link } from 'react-router-dom'
import { MapPin, Search, BookOpen, BarChart2 } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Catálogo Digital',   desc: 'Explora el inventario completo del patrimonio cultural andino de la región Junín.',  to: '/patrimonio' },
  { icon: MapPin,   title: 'Mapa Interactivo',   desc: 'Ubica bienes culturales en el territorio con georreferenciación precisa.',           to: '/mapa' },
  { icon: Search,   title: 'Búsqueda Avanzada',  desc: 'Filtra por tipo, región, período histórico y estado de conservación.',              to: '/busqueda' },
  { icon: BarChart2,title: 'Rutas Culturales',   desc: 'Descubre itinerarios turísticos basados en la riqueza patrimonial de Junín.',       to: '/mapa' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-andino-700 to-andino-900 text-white rounded-2xl p-10 mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Plataforma Inteligente de Gestión del<br />Patrimonio Cultural Digital Andino
        </h1>
        <p className="text-andino-200 max-w-2xl mx-auto mb-6">
          Descubre, preserva y comparte la riqueza cultural de la Región Junín.
          Arqueología, patrimonio inmaterial, tradiciones y más.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/patrimonio" className="btn-primary bg-white text-andino-700 hover:bg-andino-50">
            Explorar catálogo
          </Link>
          <Link to="/mapa" className="btn-secondary border-white text-white hover:bg-andino-600">
            Ver en mapa
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {features.map(({ icon: Icon, title, desc, to }) => (
          <Link key={title} to={to} className="card p-6 hover:shadow-md transition-shadow group">
            <div className="bg-andino-100 text-andino-700 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-andino-200 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats banner */}
      <div className="card p-6 bg-andino-50 border-andino-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Bienes registrados', value: '5+' },
            { label: 'Tipos de patrimonio', value: '5' },
            { label: 'Regiones cubiertas', value: 'Junín' },
            { label: 'Idiomas soportados', value: 'ES · QU · AY' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-andino-700">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
