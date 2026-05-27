import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MapPin, Search, LogOut, LayoutDashboard, Menu, X, Brain, Smartphone } from 'lucide-react'
import { useState } from 'react'
import Chatbot from './Chatbot'

export default function Layout() {
  const { isAuthenticated, user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-andino-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <MapPin className="w-5 h-5 text-andino-200" />
            <span className="hidden sm:inline">Patrimonio Cultural Junín</span>
            <span className="sm:hidden">PCJ</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/patrimonio" className="hover:text-andino-200 transition-colors">Catálogo</Link>
            <Link to="/mapa"       className="hover:text-andino-200 transition-colors">Mapa</Link>
            <Link to="/busqueda"   className="hover:text-andino-200 transition-colors flex items-center gap-1">
              <Search className="w-4 h-4" /> Búsqueda
            </Link>
            <Link to="/ia" className="hover:text-andino-200 transition-colors flex items-center gap-1">
              <Brain className="w-4 h-4" /> IA
            </Link>
            {hasRole(['investigador', 'administrador']) && (
              <Link to="/registro-movil" className="hover:text-andino-200 transition-colors flex items-center gap-1">
                <Smartphone className="w-4 h-4" /> Campo
              </Link>
            )}
            {hasRole('administrador') && (
              <Link to="/admin" className="hover:text-andino-200 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-andino-200">{user?.name}</span>
                <span className="badge bg-andino-500 text-white capitalize">{user?.rol}</span>
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm hover:text-andino-200">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </div>
            ) : (
              <>
                <Link to="/login"    className="text-sm hover:text-andino-200">Iniciar sesión</Link>
                <Link to="/registro" className="btn-primary text-sm py-1.5">Registrarse</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-andino-600 px-4 py-3 flex flex-col gap-3 text-sm">
            <Link to="/patrimonio"    onClick={() => setMenuOpen(false)}>Catálogo</Link>
            <Link to="/mapa"          onClick={() => setMenuOpen(false)}>Mapa</Link>
            <Link to="/busqueda"      onClick={() => setMenuOpen(false)}>Búsqueda</Link>
            <Link to="/ia"            onClick={() => setMenuOpen(false)}>IA</Link>
            {hasRole(['investigador', 'administrador']) && (
              <Link to="/registro-movil" onClick={() => setMenuOpen(false)}>
                📱 Registro de campo
              </Link>
            )}
            {hasRole('administrador') && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
            )}
            {isAuthenticated
              ? <button onClick={handleLogout} className="text-left">Cerrar sesión</button>
              : <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
            }
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-xs text-center py-4">
        © 2024 Plataforma Patrimonio Cultural Digital Andino · Región Junín · DIRCETUR
      </footer>

      {/* Chatbot solo para visitantes */}
      {hasRole('visitante') && <Chatbot />}
    </div>
  )
}