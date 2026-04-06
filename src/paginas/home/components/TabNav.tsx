import { LayoutDashboard, Users, Phone, UserSearch, PhoneCall, Receipt } from 'lucide-react'
import type { Aba } from '../types'

type TabNavProps = {
  abaAtiva: Aba
  onChange: (aba: Aba) => void
}

const tabs: Array<{ id: Aba; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
  { id: 'linhas', label: 'Linhas', icon: <Phone size={20} /> },
  { id: 'infoCliente', label: 'Info Cliente', icon: <UserSearch size={20} /> },
  { id: 'infoLinha', label: 'Info Linha', icon: <PhoneCall size={20} /> },
  { id: 'contas', label: 'Contas', icon: <Receipt size={20} /> },
]

export function TabNav({ abaAtiva, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Navegacao principal">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={abaAtiva === tab.id ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.id)}
          title={tab.label}
        >
          {tab.icon}
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}