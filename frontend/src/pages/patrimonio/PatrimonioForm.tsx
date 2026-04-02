import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patrimonioApi } from '@/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

type FormData = {
  nombre: string; tipo: string; descripcion: string
  latitud: number; longitud: number; altitud?: number
  estado: string; region_geografica: string
  periodo_historico: string; idioma: string
}

const TIPOS   = ['arqueologico','inmaterial','documental','arquitectonico','natural']
const ESTADOS = ['excelente','bueno','regular','deteriorado','critico']
const IDIOMAS = [{ v:'es', l:'Español' }, { v:'qu', l:'Quechua' }, { v:'ay', l:'Aymara' }]

export default function PatrimonioForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const { data: existing } = useQuery({
    queryKey: ['bien', id],
    queryFn: () => patrimonioApi.obtener(id!).then(r => r.data.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      reset({
        nombre: existing.nombre, tipo: existing.tipo?.codigo,
        descripcion: existing.descripcion,
        latitud: existing.ubicacion?.latitud, longitud: existing.ubicacion?.longitud,
        altitud: existing.ubicacion?.altitud ?? undefined,
        estado: existing.estado?.codigo,
        region_geografica: existing.region_geografica,
        periodo_historico: existing.periodo_historico,
        idioma: existing.idioma,
      })
    }
  }, [existing, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? patrimonioApi.actualizar(id!, data) : patrimonioApi.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patrimonio'] })
      toast.success(isEdit ? 'Bien actualizado.' : 'Bien registrado.')
      navigate('/patrimonio')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error al guardar.'),
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary py-1.5 px-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar bien cultural' : 'Registrar nuevo bien cultural'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="card p-6 space-y-5">
        <div>
          <label className="label">Nombre del bien cultural *</label>
          <input className="input" {...register('nombre', { required: true })} />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">Requerido</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de patrimonio *</label>
            <select className="input" {...register('tipo', { required: true })}>
              <option value="">Seleccionar...</option>
              {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Estado de conservación *</label>
            <select className="input" {...register('estado', { required: true })}>
              <option value="">Seleccionar...</option>
              {ESTADOS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Descripción *</label>
          <textarea rows={4} className="input resize-none"
            {...register('descripcion', { required: true, minLength: 20 })} />
          {errors.descripcion && <p className="text-red-500 text-xs mt-1">Mínimo 20 caracteres</p>}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Latitud *</label>
            <input type="number" step="any" className="input"
              {...register('latitud', { required: true, min: -90, max: 90, valueAsNumber: true })} />
          </div>
          <div>
            <label className="label">Longitud *</label>
            <input type="number" step="any" className="input"
              {...register('longitud', { required: true, min: -180, max: 180, valueAsNumber: true })} />
          </div>
          <div>
            <label className="label">Altitud (m)</label>
            <input type="number" step="any" className="input"
              {...register('altitud', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Región geográfica *</label>
            <input className="input" {...register('region_geografica', { required: true })} />
          </div>
          <div>
            <label className="label">Período histórico *</label>
            <input className="input" placeholder="Ej: Horizonte Medio"
              {...register('periodo_historico', { required: true })} />
          </div>
        </div>

        <div>
          <label className="label">Idioma del registro</label>
          <select className="input w-48" {...register('idioma')}>
            {IDIOMAS.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}
          </select>
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full justify-center py-2.5">
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar bien cultural'}
        </button>
      </form>
    </div>
  )
}
