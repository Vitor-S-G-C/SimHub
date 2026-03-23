import type { Cliente, Linha } from '../types'
import { toCurrency } from '../utils'

type InfoLinhaTabProps = {
  linhasInfoFiltradas: Linha[]
  clientes: Cliente[]
  buscaInfoLinha: string
  onBuscaInfoLinhaChange: (value: string) => void
}

export function InfoLinhaTab({
  linhasInfoFiltradas,
  clientes,
  buscaInfoLinha,
  onBuscaInfoLinhaChange,
}: InfoLinhaTabProps) {
  return (
    <article className="panel-card">
      <h3>Pagina de informacoes da linha</h3>
      <input
        type="search"
        placeholder="Pesquisar por linha"
        value={buscaInfoLinha}
        onChange={(event) => onBuscaInfoLinhaChange(event.target.value)}
      />

      <div className="line-cards">
        {linhasInfoFiltradas.map((linha) => {
          const cliente = clientes.find((item) => item.id === linha.clienteId)

          return (
            <article key={linha.id} className="line-card">
              <h4>{linha.numero}</h4>
              <p>Usuario: {linha.usuario}</p>
              <p>Cliente: {cliente?.nomeFantasia ?? '-'}</p>
              <p>Conta: {linha.contaLinha}</p>
              <p>Empresa: {linha.empresa}</p>
              <p>Fidelidade: {linha.fidelidade}</p>
              <p>Pagamento: {linha.dataPagamento}</p>
              <p>Valor MEM: {toCurrency(linha.valorMem)}</p>
              <p>Valor Cliente: {toCurrency(linha.valorCliente)}</p>
              <p>Status: {linha.ativa ? 'Ativa' : 'Inativa (mantida para historico)'}</p>
            </article>
          )
        })}
      </div>
    </article>
  )
}