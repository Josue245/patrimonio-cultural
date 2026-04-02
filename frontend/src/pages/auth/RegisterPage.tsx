import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', password_confirmation: '' })
  const [loading, setLoading] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await authApi.register(form)
      toast.success('Cuenta creada. Inicia sesión.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-andino-50 to-andino-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'nombre',                label: 'Nombre completo',      type: 'text' },
            { name: 'email',                 label: 'Correo electrónico',   type: 'email' },
            { name: 'password',              label: 'Contraseña',           type: 'password' },
            { name: 'password_confirmation', label: 'Confirmar contraseña', type: 'password' },
          ].map(f => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input type={f.type} name={f.name} required className="input"
                value={(form as any)[f.name]} onChange={handle} />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-andino-600 hover:underline font-medium">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
