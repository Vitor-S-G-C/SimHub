import type { Cliente, Linha } from '../types'
import { toCurrency } from '../utils'

type InfoClienteTabProps = {
  clientes: Cliente[]
  clienteSelecionadoId: number
  clienteSelecionado: Cliente | null
  buscaInfoClienteLinha: string
  linhasDoClienteSelecionado: Linha[]
  onClienteSelecionadoIdChange: (id: number) => void
  onBuscaInfoClienteLinhaChange: (value: string) => void
}

export function InfoClienteTab({
  clientes,
  clienteSelecionadoId,
  clienteSelecionado,
  buscaInfoClienteLinha,
  linhasDoClienteSelecionado,
  onClienteSelecionadoIdChange,
  onBuscaInfoClienteLinhaChange,
}: InfoClienteTabProps) {
  return (
    <article className="panel-card">
      <h3>Pagina de informacoes do cliente</h3>
      <div className="inline-filters">
        <select
          value={clienteSelecionadoId}
          onChange={(event) => onClienteSelecionadoIdChange(Number(event.target.value))}
        >
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nomeFantasia}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Pesquisar por Cliente"
          value={buscaInfoClienteLinha}
          onChange={(event) => onBuscaInfoClienteLinhaChange(event.target.value)}
        />
      </div>

      {clienteSelecionado ? (
        <div className="info-card-grid">
          <div className="soft-card">
            <span>Nome</span>
            <strong>{clienteSelecionado.nome}</strong>
          </div>
          <div className="soft-card">
            <span>Nome fantasia</span>
            <strong>{clienteSelecionado.nomeFantasia}</strong>
          </div>
          <div className="soft-card">
            <span>CNPJ</span>
            <strong>{clienteSelecionado.cnpj}</strong>
          </div>
        </div>
      ) : null}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Numero</th>
              <th>Usuario</th>
              <th>Valor MEM</th>
              <th>Valor cliente</th>
              <th>Fidelidade</th>
            </tr>
          </thead>
          <tbody>
            {linhasDoClienteSelecionado.map((linha) => (
              <tr key={linha.id}>
                <td>{linha.numero}</td>
                <td>{linha.usuario}</td>
                <td>{toCurrency(linha.valorMem)}</td>
                <td>{toCurrency(linha.valorCliente)}</td>
                <td>{linha.fidelidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}