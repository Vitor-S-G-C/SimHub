import { User, Shield, Calendar, KeyRound } from 'lucide-react'

type PerfilTabProps = {
  nome: string
  cargo: string
  login: string
}

export function PerfilTab({ nome, cargo, login }: PerfilTabProps) {
  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-avatar">
          <User size={48} />
        </div>
        <h2 className="perfil-nome">{nome}</h2>
        <span className="perfil-cargo-badge">{cargo}</span>
      </div>

      <div className="perfil-info-grid">
        <div className="perfil-info-card">
          <div className="perfil-info-icon">
            <User size={20} />
          </div>
          <div>
            <span className="perfil-info-label">Nome completo</span>
            <strong className="perfil-info-value">{nome}</strong>
          </div>
        </div>

        <div className="perfil-info-card">
          <div className="perfil-info-icon">
            <KeyRound size={20} />
          </div>
          <div>
            <span className="perfil-info-label">Login</span>
            <strong className="perfil-info-value">{login}</strong>
          </div>
        </div>

        <div className="perfil-info-card">
          <div className="perfil-info-icon">
            <Shield size={20} />
          </div>
          <div>
            <span className="perfil-info-label">Cargo</span>
            <strong className="perfil-info-value">{cargo}</strong>
          </div>
        </div>

        <div className="perfil-info-card">
          <div className="perfil-info-icon">
            <Calendar size={20} />
          </div>
          <div>
            <span className="perfil-info-label">Membro desde</span>
            <strong className="perfil-info-value">Janeiro 2024</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
