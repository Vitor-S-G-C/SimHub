import { Fragment, useState } from 'react'

import type {
  Cliente,
  ContaReceber,
  Linha,
  NovaContaPayload,
  RenovarContaPayload,
} from '../types'
import { toCurrency } from '../utils'

type ContasTabProps = {
  contasFiltradas: ContaReceber[]
  clientes: Cliente[]
  linhas: Linha[]
  buscaContas: string
  onBuscaContasChange: (value: string) => void
  onCriarConta: (payload: NovaContaPayload) => void
  onConsolidarConta: (id: number) => void
  onSalvarConta: (id: number, payload: RenovarContaPayload) => void
  onDeletarConta: (id: number) => void
}

export function ContasTab({
  contasFiltradas,
  clientes,
  linhas,
  buscaContas,
  onBuscaContasChange,
  onCriarConta,
  onConsolidarConta,
  onSalvarConta,
  onDeletarConta,
}: ContasTabProps) {
  const [contaEmEdicaoId, setContaEmEdicaoId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ dataVencimento: '', valor: '' })
  const [mostrarCadastroConta, setMostrarCadastroConta] = useState(false)
  const [novaContaForm, setNovaContaForm] = useState({
    clienteId: clientes[0]?.id ?? 0,
    valor: '',
    dataVencimento: '',
  })

  const abrirCadastroConta = () => {
    setNovaContaForm({
      clienteId: clientes[0]?.id ?? 0,
      valor: '',
      dataVencimento: '',
    })
    setMostrarCadastroConta(true)
  }

  const cancelarCadastroConta = () => {
    setMostrarCadastroConta(false)
    setNovaContaForm({
      clienteId: clientes[0]?.id ?? 0,
      valor: '',
      dataVencimento: '',
    })
  }

  const salvarNovaConta = () => {
    const valor = Number(novaContaForm.valor)
    if (!novaContaForm.clienteId || !novaContaForm.dataVencimento || Number.isNaN(valor) || valor <= 0)
      return

    onCriarConta({
      clienteId: novaContaForm.clienteId,
      dataVencimento: novaContaForm.dataVencimento,
      valor,
    })

    cancelarCadastroConta()
  }

  const abrirEdicao = (conta: ContaReceber) => {
    setContaEmEdicaoId(conta.id)
    setEditForm({
      dataVencimento: conta.dataVencimento,
      valor: String(conta.valor),
    })
  }

  const cancelarEdicao = () => {
    setContaEmEdicaoId(null)
    setEditForm({ dataVencimento: '', valor: '' })
  }

  const salvarRenovacao = (id: number) => {
    const valor = Number(editForm.valor)
    if (!editForm.dataVencimento || Number.isNaN(valor) || valor <= 0) return
    onSalvarConta(id, { dataVencimento: editForm.dataVencimento, valor })
    cancelarEdicao()
  }

  return (
    <article className="panel-card">
      <h3>Contas a receber</h3>
      <div className="actions-cell" style={{ marginBottom: '1rem' }}>
        <button
          className="primary-button"
          onClick={abrirCadastroConta}
          disabled={clientes.length === 0}
        >
          Nova conta a receber
        </button>
      </div>

      {mostrarCadastroConta ? (
        <div className="inline-filters" style={{ marginBottom: '1rem' }}>
          <label>
            Cliente
            <select
              value={novaContaForm.clienteId}
              onChange={(e) =>
                setNovaContaForm((f) => ({ ...f, clienteId: Number(e.target.value) }))
              }
            >
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nomeFantasia}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor
            <input
              type="number"
              step="0.01"
              value={novaContaForm.valor}
              onChange={(e) => setNovaContaForm((f) => ({ ...f, valor: e.target.value }))}
            />
          </label>
          <label>
            Vencimento
            <input
              type="date"
              value={novaContaForm.dataVencimento}
              onChange={(e) =>
                setNovaContaForm((f) => ({ ...f, dataVencimento: e.target.value }))
              }
            />
          </label>
          <button className="primary-button" onClick={salvarNovaConta}>
            Cadastrar conta
          </button>
          <button className="ghost-button" onClick={cancelarCadastroConta}>
            Cancelar
          </button>
        </div>
      ) : null}

      <input
        type="search"
        placeholder="Pesquisar por linha ou nome do cliente"
        value={buscaContas}
        onChange={(event) => onBuscaContasChange(event.target.value)}
      />

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Linha</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.map((conta) => {
              const cliente = clientes.find((item) => item.id === conta.clienteId)
              const linha = linhas.find((item) => item.id === conta.linhaId)
              const editando = contaEmEdicaoId === conta.id

              return (
                <Fragment key={conta.id}>
                  <tr>
                    <td>{cliente?.nomeFantasia ?? '-'}</td>
                    <td>{linha?.numero ?? '-'}</td>
                    <td>{toCurrency(conta.valor)}</td>
                    <td>{conta.dataVencimento}</td>
                    <td>
                      <span className={conta.status === 'aberto' ? 'status-open' : 'status-done'}>
                        {conta.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {conta.status === 'aberto' ? (
                        <button onClick={() => onConsolidarConta(conta.id)}>Consolidar</button>
                      ) : (
                        <>
                          <button onClick={() => abrirEdicao(conta)}>Editar</button>
                          <button onClick={() => onDeletarConta(conta.id)}>Apagar</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {editando ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="inline-filters">
                          <label>
                            Novo vencimento
                            <input
                              type="date"
                              value={editForm.dataVencimento}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, dataVencimento: e.target.value }))
                              }
                            />
                          </label>
                          <label>
                            Valor
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.valor}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, valor: e.target.value }))
                              }
                            />
                          </label>
                          <button
                            className="primary-button"
                            onClick={() => salvarRenovacao(conta.id)}
                          >
                            Salvar
                          </button>
                          <button className="ghost-button" onClick={cancelarEdicao}>
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}