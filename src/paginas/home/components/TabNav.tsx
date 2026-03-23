import type { Aba } from '../types'

type TabNavProps = {
  abaAtiva: Aba
  onChange: (aba: Aba) => void
}

const tabs: Array<{ id: Aba; label: string }> = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'linhas', label: 'Linhas' },
  { id: 'infoCliente', label: 'Info Cliente' },
  { id: 'infoLinha', label: 'Info Linha' },
  { id: 'contas', label: 'Contas a Receber' },
]

export function TabNav({ abaAtiva, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Navegacao principal">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={abaAtiva === tab.id ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}