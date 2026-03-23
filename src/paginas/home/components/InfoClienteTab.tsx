import { useEffect } from 'react'
import type { FormEventHandler } from 'react'

import type { Cliente, ClienteFormState, ContaReceber, Linha } from '../types'
import { toCurrency, toDateBr, toDateTimeBr } from '../utils'

type InfoClienteTabProps = {
  clientes: Cliente[]
  clienteSelecionadoId: number
  clienteSelecionado: Cliente | null
  clienteEmEdicao: number | null
  clienteEdicaoForm: ClienteFormState
  buscaInfoClienteLinha: string
  linhasDoClienteSelecionado: Linha[]
  linhasDoClienteTodos: Linha[]
  contasDoClienteSelecionado: ContaReceber[]
  onClienteSelecionadoIdChange: (id: number) => void
  onBuscaInfoClienteLinhaChange: (value: string) => void
  onEditarClienteSelecionado: (cliente: Cliente) => void
  onExcluirClienteSelecionado: (id: number) => void
  onCancelarEdicaoCliente: () => void
  onSalvarEdicaoCliente: FormEventHandler<HTMLFormElement>
  onClienteEdicaoFormChange: (field: keyof ClienteFormState, value: string) => void
}

export function InfoClienteTab({
  clientes,
  clienteSelecionadoId,
  clienteSelecionado,
  clienteEmEdicao,
  clienteEdicaoForm,
  buscaInfoClienteLinha,
  linhasDoClienteSelecionado,
  linhasDoClienteTodos,
  contasDoClienteSelecionado,
  onClienteSelecionadoIdChange,
  onBuscaInfoClienteLinhaChange,
  onEditarClienteSelecionado,
  onExcluirClienteSelecionado,
  onCancelarEdicaoCliente,
  onSalvarEdicaoCliente,
  onClienteEdicaoFormChange,
}: InfoClienteTabProps) {
  const contasPagas = contasDoClienteSelecionado.filter(
    (conta) => conta.status === 'consolidado',
  )
  const contasEmAberto = contasDoClienteSelecionado.filter(
    (conta) => conta.status === 'aberto',
  )
  const totalPago = contasPagas.reduce((total, conta) => total + conta.valor, 0)
  const totalAReceber = contasEmAberto.reduce((total, conta) => total + conta.valor, 0)
  const editandoClienteSelecionado =
    clienteSelecionado !== null && clienteEmEdicao === clienteSelecionado.id

  useEffect(() => {
    if (!editandoClienteSelecionado) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelarEdicaoCliente()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editandoClienteSelecionado, onCancelarEdicaoCliente])

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
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            clienteSelecionado ? onEditarClienteSelecionado(clienteSelecionado) : null
          }
          disabled={!clienteSelecionado}
        >
          Editar cliente
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() =>
            clienteSelecionado ? onExcluirClienteSelecionado(clienteSelecionado.id) : null
          }
          disabled={!clienteSelecionado}
        >
          Excluir cliente
        </button>
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
          <div className="soft-card">
            <span>Ultima atualizacao</span>
            <strong>{toDateTimeBr(clienteSelecionado.atualizadoEm)}</strong>
          </div>
          <div className="soft-card">
            <span>Atualizado por</span>
            <strong>{clienteSelecionado.atualizadoPor ?? '-'}</strong>
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
                <td>{toDateBr(linha.fidelidade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editandoClienteSelecionado ? (
        <div
          className="edit-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onCancelarEdicaoCliente()
            }
          }}
        >
          <div className="panel-card cliente-relacoes-card edit-modal-card">
            <div className="modal-header">
              <h3>Editar e acompanhar cliente</h3>
              <button type="button" className="modal-close" onClick={onCancelarEdicaoCliente}>
                x
              </button>
            </div>
            <form className="stack-form" onSubmit={onSalvarEdicaoCliente}>
              <input
                type="text"
                placeholder="Nome"
                value={clienteEdicaoForm.nome}
                onChange={(event) => onClienteEdicaoFormChange('nome', event.target.value)}
              />
              <input
                type="text"
                placeholder="Nome fantasia"
                value={clienteEdicaoForm.nomeFantasia}
                onChange={(event) =>
                  onClienteEdicaoFormChange('nomeFantasia', event.target.value)
                }
              />
              <input
                type="text"
                placeholder="CNPJ"
                value={clienteEdicaoForm.cnpj}
                onChange={(event) => onClienteEdicaoFormChange('cnpj', event.target.value)}
              />

              <div className="actions-cell">
                <button className="primary-button" type="submit">
                  Salvar alteracoes
                </button>
                <button className="ghost-button" type="button" onClick={onCancelarEdicaoCliente}>
                  Cancelar
                </button>
              </div>
            </form>

            <div className="cliente-overview-grid">
              <div className="soft-card">
                <span>Linhas vinculadas</span>
                <strong>{linhasDoClienteTodos.length}</strong>
              </div>
              <div className="soft-card">
                <span>Contas pagas</span>
                <strong>{contasPagas.length}</strong>
              </div>
              <div className="soft-card">
                <span>Contas a pagar</span>
                <strong>{contasEmAberto.length}</strong>
              </div>
              <div className="soft-card">
                <span>Total pago</span>
                <strong>{toCurrency(totalPago)}</strong>
              </div>
              <div className="soft-card">
                <span>Total a receber</span>
                <strong>{toCurrency(totalAReceber)}</strong>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contasDoClienteSelecionado.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Sem contas para este cliente.</td>
                    </tr>
                  ) : (
                    contasDoClienteSelecionado.map((conta) => {
                      const linha = linhasDoClienteSelecionado.find(
                        (item) => item.id === conta.linhaId,
                      )
                      const linhaRelacionada =
                        linha ??
                        linhasDoClienteTodos.find(
                        (item) => item.id === conta.linhaId,
                        )

                      return (
                        <tr key={conta.id}>
                          <td>{linhaRelacionada?.numero ?? '-'}</td>
                          <td>{toCurrency(conta.valor)}</td>
                          <td>{toDateBr(conta.dataVencimento)}</td>
                          <td>
                            <span
                              className={
                                conta.status === 'aberto' ? 'status-open' : 'status-done'
                              }
                            >
                              {conta.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}