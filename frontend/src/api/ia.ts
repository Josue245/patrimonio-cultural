import client from './client'

export const iaApi = {
  clasificar: (nombre: string, descripcion: string) =>
    client.post('/ia/clasificar', { nombre, descripcion }),

  analizar: (bienId?: string, bien?: object) =>
    client.post('/ia/analizar', bienId ? { bien_id: bienId } : { bien }),

  similar: (query: string, topK = 5) =>
    client.post('/ia/similar', new URLSearchParams({ query, top_k: String(topK) }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
  detectarDuplicado: (datos: { nombre: string; descripcion?: string; region_geografica?: string }) =>
    client.post('/ia/detectar-duplicado', datos),

  generarDescripcion: (datos: object) =>
    client.post('/ia/generar-descripcion', datos),

  estado: () =>
    client.get('/ia/estado'),
}
