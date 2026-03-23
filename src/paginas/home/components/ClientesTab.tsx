import type { FormEventHandler } from 'react'

import type { Cliente, ClienteFormState } from '../types'

type ClientesTabProps = {
  clienteEmEdicao: number | null
  clienteForm: ClienteFormState
  buscaCliente: string
  clientesFiltrados: Cliente[]
  onSubmit: FormEventHandler<HTMLFormElement>
  onClienteFormChange: (field: keyof ClienteFormState, value: string) => void
  onBuscaClienteChange: (value: string) => void
  onEditarCliente: (cliente: Cliente) => void
  onExcluirCliente: (id: number) => void
}

export function ClientesTab({
  clienteEmEdicao,
  clienteForm,
  buscaCliente,
  clientesFiltrados,
  onSubmit,
  onClienteFormChange,
  onBuscaClienteChange,
  onEditarCliente,
  onExcluirCliente,
}: ClientesTabProps) {
  return (
    <div className="panel-grid two-columns">
      <article className="panel-card">
        <h3>{clienteEmEdicao ? 'Editar cliente' : 'Cadastrar cliente'}</h3>
        <form className="stack-form" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Nome"
            value={clienteForm.nome}
            onChange={(event) => onClienteFormChange('nome', event.target.value)}
          />
          <input
            type="text"
            placeholder="Nome fantasia"
            value={clienteForm.nomeFantasia}
            onChange={(event) => onClienteFormChange('nomeFantasia', event.target.value)}
          />
          <input
            type="text"
            placeholder="CNPJ"
            value={clienteForm.cnpj}
            onChange={(event) => onClienteFormChange('cnpj', event.target.value)}
          />
          <button className="primary-button" type="submit">
            {clienteEmEdicao ? 'Salvar alteracoes' : 'Cadastrar'}
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h3>Clientes cadastrados</h3>
        <input
          type="search"
          placeholder="Buscar por nome, fantasia ou CNPJ"
          value={buscaCliente}
          onChange={(event) => onBuscaClienteChange(event.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome fantasia</th>
                <th>CNPJ</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nomeFantasia}</td>
                  <td>{cliente.cnpj}</td>
                  <td className="actions-cell">
                    <button onClick={() => onEditarCliente(cliente)}>Editar</button>
                    <button onClick={() => onExcluirCliente(cliente.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}