import { useState } from 'react'
import Homepage from './paginas/home'
import LoginPage from './paginas/login'
import { clearToken } from './paginas/home/api'
import type { Usuario } from './paginas/home/types'
import './App.css'

function getUsuarioSalvo(): Usuario | null {
  try {
    const raw = localStorage.getItem('simhub_usuario')
    const token = localStorage.getItem('simhub_token')
    if (raw && token) return JSON.parse(raw) as Usuario
  } catch { /* ignora */ }
  return null
}

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getUsuarioSalvo)

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('simhub_usuario')
    setUsuario(null)
  }

  if (!usuario) {
    return <LoginPage onLogin={setUsuario} />
  }

  return <Homepage usuario={usuario} onLogout={handleLogout} />
}

export default App
