import { useEffect } from 'react'
import type { FormEventHandler } from 'react'

import type { Cliente, ContaReceber, Linha, LinhaFormState } from '../types'
import { toCurrency, toDateBr, toDateTimeBr } from '../utils'

type InfoLinhaTabProps = {
  linhasInfoFiltradas: Linha[]
  clientes: Cliente[]
  linhaEmEdicaoId: number | null
  linhaEdicaoForm: LinhaFormState
  contasDaLinhaEmEdicao: ContaReceber[]
  buscaInfoLinha: string
  onBuscaInfoLinhaChange: (value: string) => void
  onEditarLinha: (linha: Linha) => void
  onExcluirLinha: (id: number) => void
  onCancelarEdicaoLinha: () => void
  onSalvarEdicaoLinha: FormEventHandler<HTMLFormElement>
  onLinhaEdicaoFormChange: <K extends keyof LinhaFormState>(
    field: K,
    value: LinhaFormState[K],
  ) => void
}

export function InfoLinhaTab({
  linhasInfoFiltradas,
  clientes,
  linhaEmEdicaoId,
  linhaEdicaoForm,
  contasDaLinhaEmEdicao,
  buscaInfoLinha,
  onBuscaInfoLinhaChange,
  onEditarLinha,
  onExcluirLinha,
  onCancelarEdicaoLinha,
  onSalvarEdicaoLinha,
  onLinhaEdicaoFormChange,
}: InfoLinhaTabProps) {
  const linhaEmEdicao =
    linhasInfoFiltradas.find((linha) => linha.id === linhaEmEdicaoId) ?? null
  const contasPagas = contasDaLinhaEmEdicao.filter((conta) => conta.status === 'consolidado')
  const contasEmAberto = contasDaLinhaEmEdicao.filter((conta) => conta.status === 'aberto')
  const totalPago = contasPagas.reduce((total, conta) => total + conta.valor, 0)
  const totalAReceber = contasEmAberto.reduce((total, conta) => total + conta.valor, 0)

  useEffect(() => {
    if (!linhaEmEdicao) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelarEdicaoLinha()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [linhaEmEdicao, onCancelarEdicaoLinha])

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
              <p>Fidelidade: {toDateBr(linha.fidelidade)}</p>
              <p>Pagamento: {toDateBr(linha.dataPagamento)}</p>
              <p>Valor MEM: {toCurrency(linha.valorMem)}</p>
              <p>Valor Cliente: {toCurrency(linha.valorCliente)}</p>
              <p>Status: {linha.ativa ? 'Ativa' : 'Inativa (mantida para historico)'}</p>
              <p>Ultima atualizacao: {toDateTimeBr(linha.atualizadoEm)}</p>
              <p>Atualizado por: {linha.atualizadoPor ?? '-'}</p>
              <div className="actions-cell">
                <button type="button" onClick={() => onEditarLinha(linha)}>
                  Editar
                </button>
                <button type="button" onClick={() => onExcluirLinha(linha.id)}>
                  Excluir
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {linhaEmEdicao ? (
        <div
          className="edit-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onCancelarEdicaoLinha()
            }
          }}
        >
          <div className="panel-card cliente-relacoes-card edit-modal-card">
            <div className="modal-header">
              <h3>Editar e acompanhar linha {linhaEmEdicao.numero}</h3>
              <button type="button" className="modal-close" onClick={onCancelarEdicaoLinha}>
                x
              </button>
            </div>
            <form className="stack-form" onSubmit={onSalvarEdicaoLinha}>
              <input
                type="text"
                placeholder="Numero da linha"
                value={linhaEdicaoForm.numero}
                onChange={(event) => onLinhaEdicaoFormChange('numero', event.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor MEM"
                value={linhaEdicaoForm.valorMem}
                onChange={(event) => onLinhaEdicaoFormChange('valorMem', event.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor Cliente"
                value={linhaEdicaoForm.valorCliente}
                onChange={(event) =>
                  onLinhaEdicaoFormChange('valorCliente', event.target.value)
                }
              />
              <input
                type="text"
                placeholder="Usuario"
                value={linhaEdicaoForm.usuario}
                onChange={(event) => onLinhaEdicaoFormChange('usuario', event.target.value)}
              />
              <input
                type="date"
                value={linhaEdicaoForm.fidelidade}
                onChange={(event) => onLinhaEdicaoFormChange('fidelidade', event.target.value)}
              />
              <select
                value={linhaEdicaoForm.clienteId}
                onChange={(event) =>
                  onLinhaEdicaoFormChange('clienteId', Number(event.target.value))
                }
              >
                {clientes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nomeFantasia}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={linhaEdicaoForm.dataPagamento}
                onChange={(event) =>
                  onLinhaEdicaoFormChange('dataPagamento', event.target.value)
                }
              />
              <input
                type="text"
                placeholder="Conta da linha"
                value={linhaEdicaoForm.contaLinha}
                onChange={(event) => onLinhaEdicaoFormChange('contaLinha', event.target.value)}
              />
              <input
                type="text"
                placeholder="Empresa"
                value={linhaEdicaoForm.empresa}
                onChange={(event) => onLinhaEdicaoFormChange('empresa', event.target.value)}
              />
              <label className="toggle-row" htmlFor="linha-edicao-ativa">
                <span>Linha ativa</span>
                <input
                  id="linha-edicao-ativa"
                  type="checkbox"
                  checked={linhaEdicaoForm.ativa}
                  onChange={(event) => onLinhaEdicaoFormChange('ativa', event.target.checked)}
                />
              </label>

              <div className="actions-cell">
                <button className="primary-button" type="submit">
                  Salvar alteracoes
                </button>
                <button className="ghost-button" type="button" onClick={onCancelarEdicaoLinha}>
                  Cancelar
                </button>
              </div>
            </form>

            <div className="cliente-overview-grid">
              <div className="soft-card">
                <span>Contas pagas</span>
                <strong>{contasPagas.length}</strong>
              </div>
              <div className="soft-card">
                <span>Contas em aberto</span>
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
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contasDaLinhaEmEdicao.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Sem contas vinculadas a esta linha.</td>
                    </tr>
                  ) : (
                    contasDaLinhaEmEdicao.map((conta) => (
                      <tr key={conta.id}>
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
                    ))
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