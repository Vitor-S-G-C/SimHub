import { type FormEvent, useState } from 'react'
import { loginRequest, setToken } from '../home/api'
import type { Usuario } from '../home/types'

type LoginPageProps = {
  onLogin: (usuario: Usuario) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!login.trim() || !senha.trim()) {
      setErro('Informe login e senha.')
      return
    }

    setCarregando(true)
    try {
      const resp = await loginRequest(login.trim(), senha.trim())
      setToken(resp.token)
      localStorage.setItem('simhub_usuario', JSON.stringify(resp.usuario))
      onLogin(resp.usuario)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao fazer login.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-panel">
        <div className="login-copy">
          <div>
            <span className="login-badge">SimHub</span>
            <h1 style={{ marginTop: 16 }}>Gestao de Clientes e Linhas</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Acesse o painel para gerenciar clientes, linhas e contas a receber.
            </p>
          </div>
          <div className="login-highlights">
            <div>
              <strong>Clientes</strong>
              <span>Cadastro completo</span>
            </div>
            <div>
              <strong>Linhas</strong>
              <span>Controle de linhas</span>
            </div>
            <div>
              <strong>Contas</strong>
              <span>Contas a receber</span>
            </div>
            <div>
              <strong>Dashboard</strong>
              <span>Visao geral</span>
            </div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Entrar</h2>
          <label className="field-group">
            <span>Login</span>
            <input
              type="text"
              placeholder="Seu login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="field-group">
            <span>Senha</span>
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {erro ? <p className="login-feedback">{erro}</p> : null}
          <button className="login-button" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default LoginPage
