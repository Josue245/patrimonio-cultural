import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import LoginPage       from './pages/auth/LoginPage'
import RegisterPage    from './pages/auth/RegisterPage'
import HomePage        from './pages/HomePage'
import PatrimonioList  from './pages/patrimonio/PatrimonioList'
import PatrimonioDetail from './pages/patrimonio/PatrimonioDetail'
import PatrimonioForm  from './pages/patrimonio/PatrimonioForm'
import MapaPage        from './pages/mapa/MapaPage'
import BusquedaPage    from './pages/BusquedaPage'
import AdminDashboard  from './pages/admin/AdminDashboard'
import IAPanel         from './pages/ia/IAPanel'
import Layout          from './components/layout/Layout'

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !hasRole(roles)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* App shell */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="patrimonio"           element={<PatrimonioList />} />
        <Route path="patrimonio/:id"       element={<PatrimonioDetail />} />
        <Route path="busqueda"             element={<BusquedaPage />} />
        <Route path="mapa"                 element={<MapaPage />} />
        <Route path="ia"                   element={<IAPanel />} />

        {/* Investigador + Admin */}
        <Route path="patrimonio/nuevo" element={
          <PrivateRoute roles={['administrador']}>
            <PatrimonioForm />
          </PrivateRoute>
        } />
        <Route path="patrimonio/:id/editar" element={
          <PrivateRoute roles={['administrador']}>
            <PatrimonioForm />
          </PrivateRoute>
        } />

        {/* Admin only */}
        <Route path="admin" element={
          <PrivateRoute roles={['administrador']}>
            <AdminDashboard />
          </PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
