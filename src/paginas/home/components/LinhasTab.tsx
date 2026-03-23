import type { FormEventHandler } from 'react'

import type { Cliente, Linha, LinhaFormState } from '../types'

type LinhasTabProps = {
  linhaForm: LinhaFormState
  clientes: Cliente[]
  buscaLinha: string
  linhasFiltradas: Linha[]
  onSubmit: FormEventHandler<HTMLFormElement>
  onLinhaFormChange: <K extends keyof LinhaFormState>(field: K, value: LinhaFormState[K]) => void
  onBuscaLinhaChange: (value: string) => void
}

export function LinhasTab({
  linhaForm,
  clientes,
  buscaLinha,
  linhasFiltradas,
  onSubmit,
  onLinhaFormChange,
  onBuscaLinhaChange,
}: LinhasTabProps) {
  return (
    <div className="panel-grid two-columns">
      <article className="panel-card">
        <h3>Cadastrar linha</h3>
        <form className="stack-form" onSubmit={onSubmit}>
          <label className="field-group" htmlFor="linha-numero">
            <span>Numero da linha (telefone/chip)</span>
            <input
              id="linha-numero"
              type="text"
              placeholder="Ex.: 11999990000"
              value={linhaForm.numero}
              onChange={(event) => onLinhaFormChange('numero', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-valor-mem">
            <span>Valor pago</span>
            <input
              id="linha-valor-mem"
              type="number"
              step="0.01"
              placeholder="Ex.: 45.90"
              value={linhaForm.valorMem}
              onChange={(event) => onLinhaFormChange('valorMem', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-valor-cliente">
            <span>Valor cobrado</span>
            <input
              id="linha-valor-cliente"
              type="number"
              step="0.01"
              placeholder="Ex.: 60.00"
              value={linhaForm.valorCliente}
              onChange={(event) => onLinhaFormChange('valorCliente', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-usuario">
            <span>Usuario responsavel pela linha</span>
            <input
              id="linha-usuario"
              type="text"
              placeholder="Nome de quem usa a linha"
              value={linhaForm.usuario}
              onChange={(event) => onLinhaFormChange('usuario', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-fidelidade">
            <span>Data de fidelidade (fim da fidelizacao)</span>
            <input
              id="linha-fidelidade"
              type="date"
              value={linhaForm.fidelidade}
              onChange={(event) => onLinhaFormChange('fidelidade', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-cliente">
            <span>Cliente dono da linha</span>
            <select
              id="linha-cliente"
              value={linhaForm.clienteId}
              disabled={clientes.length === 0}
              onChange={(event) => onLinhaFormChange('clienteId', Number(event.target.value))}
            >
              {clientes.length === 0 ? (
                <option value={0}>Cadastre um cliente primeiro</option>
              ) : null}
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nomeFantasia}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group" htmlFor="linha-data-pagamento">
            <span>Data de pagamento/vencimento</span>
            <input
              id="linha-data-pagamento"
              type="date"
              value={linhaForm.dataPagamento}
              onChange={(event) => onLinhaFormChange('dataPagamento', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-conta">
            <span>Conta da linha (plano/conta vinculada)</span>
            <input
              id="linha-conta"
              type="text"
              placeholder="Ex.: Conta corporativa XYZ"
              value={linhaForm.contaLinha}
              onChange={(event) => onLinhaFormChange('contaLinha', event.target.value)}
            />
          </label>

          <label className="field-group" htmlFor="linha-empresa">
            <span>Empresa registrada</span>
            <input
              id="linha-empresa"
              type="text"
              placeholder="Nome da empresa responsavel"
              value={linhaForm.empresa}
              onChange={(event) => onLinhaFormChange('empresa', event.target.value)}
            />
          </label>
          <label className="toggle-row" htmlFor="ativa">
            <span>Linha ativa</span>
            <input
              id="ativa"
              type="checkbox"
              checked={linhaForm.ativa}
              onChange={(event) => onLinhaFormChange('ativa', event.target.checked)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={clientes.length === 0}>
            Cadastrar
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h3>Linhas cadastradas</h3>
        <input
          type="search"
          placeholder="Buscar por numero, usuario ou cliente"
          value={buscaLinha}
          onChange={(event) => onBuscaLinhaChange(event.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Usuario</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((linha) => {
                const cliente = clientes.find((item) => item.id === linha.clienteId)
                return (
                  <tr key={linha.id}>
                    <td>{linha.numero}</td>
                    <td>{linha.usuario}</td>
                    <td>{cliente?.nomeFantasia ?? '-'}</td>
                    <td>{linha.ativa ? 'Ativa' : 'Inativa'}</td>
                    <td>Gerenciar na aba Info Linha</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}