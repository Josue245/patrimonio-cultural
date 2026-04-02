// src/types/index.ts

export type TipoPatrimonio =
  | 'arqueologico'
  | 'inmaterial'
  | 'documental'
  | 'arquitectonico'
  | 'natural'

export type EstadoConservacion =
  | 'excelente'
  | 'bueno'
  | 'regular'
  | 'deteriorado'
  | 'critico'

export type Idioma = 'es' | 'qu' | 'ay'

export type Rol = 'visitante' | 'investigador' | 'administrador'

export interface GeoPoint {
  latitud: number
  longitud: number
  altitud?: number | null
}

export interface BienCultural {
  id: string
  nombre: string
  tipo: {
    codigo: TipoPatrimonio
    label: string
  } | TipoPatrimonio
  descripcion: string
  ubicacion?: GeoPoint
  coordenadas?: GeoPoint
  estado: {
    codigo: EstadoConservacion
    label: string
  } | EstadoConservacion
  region_geografica: string
  periodo_historico: string
  idioma: Idioma
  comunidad_id: string | null
  creado_en: string
  multimedia?: Multimedia[]
}

export interface Multimedia {
  id: string
  bien_cultural_id: string
  tipo: 'fotografia' | 'video' | 'audio' | 'documento'
  nombre_original: string
  url_publica: string
  descripcion?: string
}

export interface Comunidad {
  id: string
  nombre: string
  region: string
  lengua_principal: Idioma
  descripcion?: string
  latitud?: number
  longitud?: number
}

export interface User {
  id: string
  name: string
  email: string
  rol: Rol
}

export interface AuthResponse {
  success: boolean
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface FiltrosBusqueda {
  q?: string
  tipo?: TipoPatrimonio | ''
  region?: string
  periodo?: string
  estado?: EstadoConservacion | ''
  idioma?: Idioma | ''
  page?: number
  per_page?: number
}

export interface EstadisticasPatrimonio {
  por_tipo: { tipo: string; total: number }[]
  por_region: { region_geografica: string; total: number }[]
  por_estado: { estado: string; total: number }[]
}
