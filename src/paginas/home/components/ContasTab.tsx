import { Fragment, useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type {
  Cliente,
  ContaReceber,
  NovaContaPayload,
  RenovarContaPayload,
} from '../types'
import { toCurrency, toDateBr } from '../utils'

type ContasTabProps = {
  contasFiltradas: ContaReceber[]
  clientes: Cliente[]
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
  buscaContas,
  onBuscaContasChange,
  onCriarConta,
  onConsolidarConta,
  onSalvarConta,
  onDeletarConta,
}: ContasTabProps) {
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())
  const [contaEmEdicaoId, setContaEmEdicaoId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ dataVencimento: '', valor: '', descricao: '' })
  const [mostrarCadastroConta, setMostrarCadastroConta] = useState(false)
  const [novaContaForm, setNovaContaForm] = useState({
    clienteId: clientes[0]?.id ?? 0,
    valor: '',
    dataVencimento: '',
    descricao: '',
  })

  const clienteGroups = useMemo(() => {
    const groups = new Map<number, ContaReceber[]>()
    for (const conta of contasFiltradas) {
      const arr = groups.get(conta.clienteId) ?? []
      arr.push(conta)
      groups.set(conta.clienteId, arr)
    }

    return Array.from(groups.entries()).map(([clienteId, contasDoCliente]) => {
      const cliente = clientes.find((c) => c.id === clienteId)
      const valorTotal = contasDoCliente.reduce((sum, c) => sum + c.valor, 0)
      const contasAbertas = contasDoCliente.filter((c) => c.status === 'aberto')
      const vencimentos = contasDoCliente.map((c) => c.dataVencimento).sort()
      const proximoVencimento = contasAbertas.length > 0
        ? contasAbertas.map((c) => c.dataVencimento).sort()[0]
        : vencimentos[vencimentos.length - 1] ?? ''
      const statusGeral: 'aberto' | 'consolidado' = contasAbertas.length > 0 ? 'aberto' : 'consolidado'

      return {
        clienteId,
        nomeFantasia: cliente?.nomeFantasia ?? `Cliente #${clienteId}`,
        contas: contasDoCliente,
        valorTotal,
        proximoVencimento,
        statusGeral,
      }
    })
  }, [contasFiltradas, clientes])

  const toggleClient = (clienteId: number) => {
    setExpandedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clienteId)) next.delete(clienteId)
      else next.add(clienteId)
      return next
    })
  }

  const abrirCadastroConta = () => {
    setNovaContaForm({
      clienteId: clientes[0]?.id ?? 0,
      valor: '',
      dataVencimento: '',
      descricao: '',
    })
    setMostrarCadastroConta(true)
  }

  const cancelarCadastroConta = () => {
    setMostrarCadastroConta(false)
    setNovaContaForm({
      clienteId: clientes[0]?.id ?? 0,
      valor: '',
      dataVencimento: '',
      descricao: '',
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
      descricao: novaContaForm.descricao || undefined,
    })

    cancelarCadastroConta()
  }

  const abrirEdicao = (conta: ContaReceber) => {
    setContaEmEdicaoId(conta.id)
    setEditForm({
      dataVencimento: conta.dataVencimento,
      valor: String(conta.valor),
      descricao: conta.descricao ?? '',
    })
  }

  const cancelarEdicao = () => {
    setContaEmEdicaoId(null)
    setEditForm({ dataVencimento: '', valor: '', descricao: '' })
  }

  const salvarRenovacao = (id: number) => {
    const valor = Number(editForm.valor)
    if (!editForm.dataVencimento || Number.isNaN(valor) || valor <= 0) return
    onSalvarConta(id, { dataVencimento: editForm.dataVencimento, valor, descricao: editForm.descricao || undefined })
    cancelarEdicao()
  }

  return (
    <article className="panel-card">
      <h3>Contas</h3>
      <div className="actions-cell" style={{ marginBottom: '1rem' }}>
        <button
          className="primary-button"
          onClick={abrirCadastroConta}
          disabled={clientes.length === 0}
        >
          Nova conta
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
          <label>
            Descrição (opcional)
            <input
              type="text"
              placeholder="Ex: Mensalidade março"
              value={novaContaForm.descricao}
              onChange={(e) => setNovaContaForm((f) => ({ ...f, descricao: e.target.value }))}
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
        placeholder="Pesquisar por nome do cliente"
        value={buscaContas}
        onChange={(event) => onBuscaContasChange(event.target.value)}
      />

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Cliente</th>
              <th>Valor Total</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clienteGroups.map((group) => {
              const expanded = expandedClients.has(group.clienteId)
              const contasAbertasDoCliente = group.contas.filter((c) => c.status === 'aberto')

              return (
                <Fragment key={group.clienteId}>
                  <tr
                    className="cliente-accordion-row"
                    onClick={() => toggleClient(group.clienteId)}
                  >
                    <td className="expand-cell">
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td><strong>{group.nomeFantasia}</strong></td>
                    <td><strong>{toCurrency(group.valorTotal)}</strong></td>
                    <td>{toDateBr(group.proximoVencimento)}</td>
                    <td>
                      <span className={group.statusGeral === 'aberto' ? 'status-open' : 'status-done'}>
                        {group.statusGeral}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {contasAbertasDoCliente.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            contasAbertasDoCliente.forEach((c) => onConsolidarConta(c.id))
                          }}
                        >
                          Consolidar tudo
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded && group.contas.map((conta) => {
                    const editando = contaEmEdicaoId === conta.id

                    return (
                      <Fragment key={conta.id}>
                        <tr className={`conta-detalhe-row ${editando ? 'conta-editando' : ''}`}>
                          <td></td>
                          <td className="sub-row-label">{conta.descricao || 'Sem descrição'}</td>
                          <td>{toCurrency(conta.valor)}</td>
                          <td>{toDateBr(conta.dataVencimento)}</td>
                          <td>
                            <span className={conta.status === 'aberto' ? 'status-open' : 'status-done'}>
                              {conta.status}
                            </span>
                            {conta.tipo === 'taxa' ? (
                              <span className="status-taxa"> taxa</span>
                            ) : null}
                          </td>
                          <td className="actions-cell">
                            {conta.status === 'aberto' ? (
                              <button onClick={(e) => { e.stopPropagation(); onConsolidarConta(conta.id) }}>Consolidar</button>
                            ) : (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); abrirEdicao(conta) }}>Editar</button>
                                <button onClick={(e) => { e.stopPropagation(); onDeletarConta(conta.id) }}>Apagar</button>
                              </>
                            )}
                          </td>
                        </tr>
                        {editando ? (
                          <tr className="conta-edit-row">
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
                                <label>
                                  Descrição
                                  <input
                                    type="text"
                                    placeholder="Opcional"
                                    value={editForm.descricao}
                                    onChange={(e) =>
                                      setEditForm((f) => ({ ...f, descricao: e.target.value }))
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
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}