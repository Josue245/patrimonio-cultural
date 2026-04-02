// src/api/patrimonio.ts
import client from './client'
import type {
  BienCultural,
  FiltrosBusqueda,
  PaginatedResponse,
  ApiResponse,
  EstadisticasPatrimonio,
} from '@/types'

export const patrimonioApi = {
  listar: (filtros: FiltrosBusqueda = {}) =>
    client.get<PaginatedResponse<BienCultural>>('/bienes-culturales', { params: filtros }),

  obtener: (id: string) =>
    client.get<ApiResponse<BienCultural>>(`/bienes-culturales/${id}`),

  crear: (data: Partial<BienCultural> & Record<string, unknown>) =>
    client.post<ApiResponse<BienCultural>>('/bienes-culturales', data),

  actualizar: (id: string, data: Partial<BienCultural> & Record<string, unknown>) =>
    client.put<ApiResponse<BienCultural>>(`/bienes-culturales/${id}`, data),

  eliminar: (id: string) =>
    client.delete<ApiResponse<null>>(`/bienes-culturales/${id}`),

  busquedaAvanzada: (filtros: FiltrosBusqueda) =>
    client.get<PaginatedResponse<BienCultural>>('/busqueda', { params: filtros }),

  cercanos: (latitud: number, longitud: number, radioKm = 10) =>
    client.get<ApiResponse<BienCultural[]>>('/mapa/bienes', {
      params: { latitud, longitud, radio_km: radioKm },
    }),

  estadisticas: () =>
    client.get<ApiResponse<EstadisticasPatrimonio>>('/reportes/estadisticas'),

  exportarFicha: (id: string) =>
    client.get(`/bienes-culturales/${id}/ficha-pdf`, { responseType: 'blob' }),
}

// src/api/auth.ts
export const authApi = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }),

  register: (data: { nombre: string; email: string; password: string; password_confirmation: string }) =>
    client.post('/auth/register', data),

  me: () => client.get('/auth/me'),

  logout: () => client.post('/auth/logout'),

  refresh: () => client.post('/auth/refresh'),
}

// src/api/multimedia.ts
export const multimediaApi = {
  subir: (bienId: string, archivo: File, tipo: string, descripcion?: string) => {
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('bien_cultural_id', bienId)
    form.append('tipo', tipo)
    if (descripcion) form.append('descripcion', descripcion)
    return client.post('/multimedia/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  eliminar: (id: string) => client.delete(`/multimedia/${id}`),
}
