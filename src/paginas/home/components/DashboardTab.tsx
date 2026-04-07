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
import type { ContaReceber, Cliente, Linha } from '../types'
import { toCurrency } from '../utils'

type DashboardTabProps = {
  contas: ContaReceber[]
  clientes: Cliente[]
  linhas: Linha[]
  totalClientes: number
  totalLinhas: number
  role: 'admin' | 'coordenacao'
}

const nomesMeses = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function mesKey(dataVencimento: string) {
  const date = new Date(dataVencimento)
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
}

function agruparLucrosCoordenador(contas: ContaReceber[], linhasMap: Map<number, Linha>) {
  const meses: Record<string, { recebido: number; aReceber: number }> = {}

  for (const conta of contas) {
    if (conta.tipo === 'taxa') continue
    const key = mesKey(conta.dataVencimento)
    if (!meses[key]) meses[key] = { recebido: 0, aReceber: 0 }

    const linha = conta.linhaId ? linhasMap.get(conta.linhaId) : null
    const lucro = linha ? linha.valorCliente - linha.valorMem : conta.valor

    if (conta.status === 'consolidado') {
      meses[key].recebido += lucro
    } else {
      meses[key].aReceber += lucro
    }
  }

  return Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, valores]) => {
      const [, mes] = key.split('-')
      return { nome: nomesMeses[Number(mes)], recebido: valores.recebido, aReceber: valores.aReceber }
    })
}

function agruparLucrosAdmin(contas: ContaReceber[], linhasMap: Map<number, Linha>) {
  const meses: Record<string, { recebido: number; aReceber: number }> = {}

  // Lucro do admin = 5% do lucro de cada conta de coordenador
  for (const conta of contas) {
    if (conta.tipo === 'taxa') continue
    const key = mesKey(conta.dataVencimento)
    if (!meses[key]) meses[key] = { recebido: 0, aReceber: 0 }

    const linha = conta.linhaId ? linhasMap.get(conta.linhaId) : null
    const lucro = linha ? (linha.valorCliente - linha.valorMem) * 0.05 : 0

    if (conta.status === 'consolidado') {
      meses[key].recebido += lucro
    } else {
      meses[key].aReceber += lucro
    }
  }

  return Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, valores]) => {
      const [, mes] = key.split('-')
      return { nome: nomesMeses[Number(mes)], recebido: Math.round(valores.recebido * 100) / 100, aReceber: Math.round(valores.aReceber * 100) / 100 }
    })
}

function agruparRecebidoVsAReceber(contas: ContaReceber[]) {
  const meses: Record<string, { recebido: number; aReceber: number }> = {}

  for (const conta of contas) {
    if (conta.tipo === 'taxa') continue
    const key = mesKey(conta.dataVencimento)
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
      return { nome: nomesMeses[Number(mes)], recebido: valores.recebido, aReceber: valores.aReceber }
    })
}

export function DashboardTab({ contas, clientes, linhas, totalClientes, totalLinhas, role }: DashboardTabProps) {
  const contasNormais = contas.filter((c) => c.tipo !== 'taxa')
  const contasAReceber = contasNormais.filter((c) => c.status === 'aberto')
  const contasRecebidas = contasNormais.filter((c) => c.status === 'consolidado')

  const linhasMap = new Map(linhas.map((l) => [l.id, l]))

  // Calcular lucro baseado no role
  let lucroTotal: number
  let valorAReceber: number

  if (role === 'admin') {
    // Admin: 5% do lucro de cada conta
    lucroTotal = contasRecebidas.reduce((sum, c) => {
      const linha = c.linhaId ? linhasMap.get(c.linhaId) : null
      return sum + (linha ? (linha.valorCliente - linha.valorMem) * 0.05 : 0)
    }, 0)
    valorAReceber = contasAReceber.reduce((sum, c) => {
      const linha = c.linhaId ? linhasMap.get(c.linhaId) : null
      return sum + (linha ? (linha.valorCliente - linha.valorMem) * 0.05 : 0)
    }, 0)
  } else {
    // Coordenador: lucro real (valorCliente - valorMem)
    lucroTotal = contasRecebidas.reduce((sum, c) => {
      const linha = c.linhaId ? linhasMap.get(c.linhaId) : null
      return sum + (linha ? linha.valorCliente - linha.valorMem : c.valor)
    }, 0)
    valorAReceber = contasAReceber.reduce((sum, c) => {
      const linha = c.linhaId ? linhasMap.get(c.linhaId) : null
      return sum + (linha ? linha.valorCliente - linha.valorMem : c.valor)
    }, 0)
  }

  const dadosLucros = role === 'admin'
    ? agruparLucrosAdmin(contas, linhasMap)
    : agruparLucrosCoordenador(contas, linhasMap)

  const dadosRecebidoVsAReceber = agruparRecebidoVsAReceber(contas)

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
          <span className="dash-stat-label">{role === 'admin' ? 'Taxa Coordenação (5%)' : 'Lucro Total'}</span>
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
          <h3>{role === 'admin' ? 'Taxa Coordenação por Mês' : 'Lucros por Mês'}</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosLucros}>
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
              <BarChart data={dadosRecebidoVsAReceber}>
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
