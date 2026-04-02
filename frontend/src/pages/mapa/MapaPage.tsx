import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import type { BienCultural } from '@/types'
import { Link } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Centro de Junín, Perú
const JUNIN_CENTER: [number, number] = [-11.9, -75.25]

export default function MapaPage() {
  const { data } = useQuery({
    queryKey: ['patrimonio-mapa'],
    queryFn: () => patrimonioApi.listar({ per_page: 100 }).then(r => r.data),
  })

  const bienes: BienCultural[] = data?.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Mapa de Patrimonio Cultural</h1>
      <p className="text-sm text-gray-500 mb-4">
        {bienes.length} bien(es) cultural(es) georreferenciado(s) en la Región Junín
      </p>

      <div className="card overflow-hidden" style={{ height: '70vh' }}>
        <MapContainer
          center={JUNIN_CENTER}
          zoom={9}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bienes.map(bien => {
            const lat = bien.ubicacion?.latitud  ?? bien.coordenadas?.latitud
            const lng = bien.ubicacion?.longitud ?? bien.coordenadas?.longitud
            if (!lat || !lng) return null
            return (
              <Marker key={bien.id} position={[lat, lng]}>
                <Popup>
                  <div className="min-w-48">
                    <p className="font-semibold text-gray-900 mb-1">{bien.nombre}</p>
                    <p className="text-xs text-gray-500 capitalize mb-1">
                     {typeof bien.tipo === 'object' ? bien.tipo.label : bien.tipo}
                       </p>
                    <p className="text-xs text-gray-500 mb-2">{bien.region_geografica}</p>
                    <a href={`/patrimonio/${bien.id}`}
                      className="text-xs text-andino-600 hover:underline font-medium">
                      Ver detalle →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
