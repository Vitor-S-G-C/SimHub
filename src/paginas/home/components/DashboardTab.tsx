import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import type { ContaReceber, Cliente } from '../types'
import { toCurrency } from '../utils'

type DashboardTabProps = {
  contas: ContaReceber[]
  clientes: Cliente[]
  totalClientes: number
  totalLinhas: number
}

function agruparContasPorMes(contas: ContaReceber[]) {
  const meses: Record<string, { recebido: number; aReceber: number }> = {}
  const nomesMeses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]

  for (const conta of contas) {
    const date = new Date(conta.dataVencimento)
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
    if (!meses[key]) meses[key] = { recebido: 0, aReceber: 0 }
    if (conta.status === 'consolidado') {
      meses[key].recebido += conta.valor
    } else {
      meses[key].aReceber += conta.valor
    }
  }

  return Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, valores]) => {
      const [, mes] = key.split('-')
      return {
        nome: nomesMeses[Number(mes)],
        recebido: valores.recebido,
        aReceber: valores.aReceber,
      }
    })
}

export function DashboardTab({ contas, clientes, totalClientes, totalLinhas }: DashboardTabProps) {
  const contasAReceber = contas.filter((c) => c.status === 'aberto')
  const contasRecebidas = contas.filter((c) => c.status === 'consolidado')
  const valorAReceber = contasAReceber.reduce((sum, c) => sum + c.valor, 0)
  const valorRecebido = contasRecebidas.reduce((sum, c) => sum + c.valor, 0)
  const lucroTotal = valorRecebido

  const dadosMensais = agruparContasPorMes(contas)

  const clientesMap = new Map(clientes.map((c) => [c.id, c.nomeFantasia]))

  const hoje = new Date()
  const em7dias = new Date()
  em7dias.setDate(hoje.getDate() + 7)

  const contasPertoDeVencer = contasAReceber
    .filter((c) => {
      const venc = new Date(c.dataVencimento)
      return venc >= hoje && venc <= em7dias
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))

  return (
    <div className="dashboard-container">
      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Lucro Total</span>
          <strong className="dash-stat-value accent">{toCurrency(lucroTotal)}</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">A Receber</span>
          <strong className="dash-stat-value">{toCurrency(valorAReceber)}</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Clientes</span>
          <strong className="dash-stat-value">{totalClientes}</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Linhas</span>
          <strong className="dash-stat-value">{totalLinhas}</strong>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Lucros por Mês</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosMensais}>
                <defs>
                  <linearGradient id="gradRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#1a0a0a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  formatter={(value) => toCurrency(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="recebido"
                  stroke="#ff6b6b"
                  strokeWidth={2}
                  fill="url(#gradRecebido)"
                  name="Recebido"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Recebido vs A Receber</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="nome" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: '#1a0a0a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                  formatter={(value) => toCurrency(Number(value))}
                />
                <Bar dataKey="recebido" fill="#ff6b6b" radius={[6, 6, 0, 0]} name="Recebido" />
                <Bar dataKey="aReceber" fill="rgba(189, 34, 34, 0.25)" radius={[6, 6, 0, 0]} name="A Receber" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {contasPertoDeVencer.length > 0 && (
        <div className="alert-card-vencimento">
          <div className="alert-card-header">
            <AlertTriangle size={20} />
            <strong>Faturas perto de vencer ({contasPertoDeVencer.length})</strong>
          </div>
          <div className="alert-card-list">
            {contasPertoDeVencer.map((c) => (
              <div key={c.id} className="alert-card-item">
                <span className="alert-cliente">{clientesMap.get(c.clienteId) ?? `Cliente #${c.clienteId}`}</span>
                <span className="alert-valor">{toCurrency(c.valor)}</span>
                <span className="alert-data">{new Date(c.dataVencimento).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
