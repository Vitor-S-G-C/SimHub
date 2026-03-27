import { ClientesTab } from './components/ClientesTab'
import { ContasTab } from './components/ContasTab'
import { InfoClienteTab } from './components/InfoClienteTab'
import { InfoLinhaTab } from './components/InfoLinhaTab'
import { LinhasTab } from './components/LinhasTab'
import { Pagination } from './components/Pagination'
import { TabNav } from './components/TabNav'
import { useHomeController } from './hooks/useHomeController'
import { toCurrency, toDateBr } from './utils'

function Homepage() {
  const {
    abaAtiva,
    setAbaAtiva,
    clientes,
    linhas,
    contas,
    carregandoDados,
    buscaCliente,
    setBuscaCliente,
    buscaLinha,
    setBuscaLinha,
    buscaInfoClienteLinha,
    setBuscaInfoClienteLinha,
    buscaInfoLinha,
    setBuscaInfoLinha,
    buscaContas,
    setBuscaContas,
    clienteSelecionadoId,
    setClienteSelecionadoId,
    clienteEmEdicao,
    linhaEmEdicao,
    clienteForm,
    clienteEdicaoForm,
    linhaForm,
    linhaEdicaoForm,
    toasts,
    setToasts,
    confirmDelete,
    setConfirmDelete,
    notificacoesVisiveis,
    clientesPaginados,
    linhasPaginadas,
    linhasInfoClientePaginadas,
    linhasInfoPaginadas,
    contasPaginadas,
    setPaginaClientes,
    setPaginaLinhas,
    setPaginaInfoClienteLinhas,
    setPaginaInfoLinha,
    setPaginaContas,
    clienteSelecionado,
    linhasDoClienteSelecionado,
    contasDoClienteSelecionado,
    contasDaLinhaEmEdicao,
    atualizarClienteForm,
    atualizarClienteEdicaoForm,
    atualizarLinhaForm,
    atualizarLinhaEdicaoForm,
    fecharNotificacao,
    salvarCliente,
    editarCliente,
    cancelarEdicaoCliente,
    salvarEdicaoCliente,
    salvarLinha,
    editarLinha,
    cancelarEdicaoLinha,
    salvarEdicaoLinha,
    consolidarConta,
    criarConta,
    salvarConta,
    deletarConta,
    solicitarExclusaoCliente,
    solicitarExclusaoLinha,
    confirmarExclusao,
  } = useHomeController()

  const contasAReceber = contas.filter((conta) => conta.status === 'aberto')
  const contasRecebidas = contas.filter((conta) => conta.status === 'consolidado')
  const valorAReceber = contasAReceber.reduce((sum, conta) => sum + conta.valor, 0)
  const valorRecebido = contasRecebidas.reduce((sum, conta) => sum + conta.valor, 0)
  const totalContas = contas.length

  return (
    <main className="helix-shell">
      <header className="helix-topbar">
        <div>
          <span className="login-badge">HELIX SaaS</span>
          <h2>Gestao de linhas e cobranca</h2>
          <p>Painel aberto sem login.</p>
        </div>
        <div className="topbar-actions">
          <div className="welcome-copy">
            <strong>Bem vindo Ednei</strong>
            <small>Velho da lancha</small>
          </div>
          <button className="ghost-button" onClick={() => window.location.reload()}>
            Sair
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Contas a receber</span>
          <strong>{contasAReceber.length}</strong>
          <small>{toCurrency(valorAReceber)}</small>
        </article>
        <article className="stat-card">
          <span>Contas recebidas</span>
          <strong>{contasRecebidas.length}</strong>
          <small>{toCurrency(valorRecebido)}</small>
        </article>
        <article className="stat-card">
          <span>Total</span>
          <strong>{totalContas}</strong>
          <small>{toCurrency(contas.reduce((sum, conta) => sum + conta.valor, 0))}</small>
        </article>
      </section>

      {notificacoesVisiveis.length > 0 ? (
        <section className="notification-strip" role="status">
          {notificacoesVisiveis.slice(0, 3).map((conta) => {
            const cliente = clientes.find((item) => item.id === conta.clienteId)
            const linha = linhas.find((item) => item.id === conta.linhaId)

            return (
              <div key={conta.id} className="notification-item">
                <p>
                  Vencimento proximo: {cliente?.nomeFantasia} / {linha?.numero} ({' '}
                  {toDateBr(conta.dataVencimento)}).
                </p>
                <button
                  type="button"
                  className="notification-close"
                  aria-label="Fechar notificacao"
                  onClick={() => fecharNotificacao(conta.id)}
                >
                  x
                </button>
              </div>
            )
          })}
        </section>
      ) : null}

      <section className="helix-layout">
        <aside className="helix-sidebar">
          <TabNav abaAtiva={abaAtiva} onChange={setAbaAtiva} />
        </aside>

        <section className="panel-area">
          {carregandoDados ? <p className="login-feedback">Carregando dados...</p> : null}

          {abaAtiva === 'clientes' ? (
            <>
              <ClientesTab
                clienteForm={clienteForm}
                buscaCliente={buscaCliente}
                clientesFiltrados={clientesPaginados.items}
                onSubmit={salvarCliente}
                onClienteFormChange={atualizarClienteForm}
                onBuscaClienteChange={setBuscaCliente}
              />
              <Pagination
                page={clientesPaginados.page}
                totalPages={clientesPaginados.totalPages}
                totalItems={clientesPaginados.totalItems}
                onPageChange={setPaginaClientes}
              />
            </>
          ) : null}

          {abaAtiva === 'linhas' ? (
            <>
              <LinhasTab
                linhaForm={linhaForm}
                clientes={clientes}
                buscaLinha={buscaLinha}
                linhasFiltradas={linhasPaginadas.items}
                onSubmit={salvarLinha}
                onLinhaFormChange={atualizarLinhaForm}
                onBuscaLinhaChange={setBuscaLinha}
              />
              <Pagination
                page={linhasPaginadas.page}
                totalPages={linhasPaginadas.totalPages}
                totalItems={linhasPaginadas.totalItems}
                onPageChange={setPaginaLinhas}
              />
            </>
          ) : null}

          {abaAtiva === 'infoCliente' ? (
            <>
              <InfoClienteTab
                clientes={clientes}
                clienteSelecionadoId={clienteSelecionadoId}
                clienteSelecionado={clienteSelecionado}
                clienteEmEdicao={clienteEmEdicao}
                clienteEdicaoForm={clienteEdicaoForm}
                buscaInfoClienteLinha={buscaInfoClienteLinha}
                linhasDoClienteSelecionado={linhasInfoClientePaginadas.items}
                linhasDoClienteTodos={linhasDoClienteSelecionado}
                contasDoClienteSelecionado={contasDoClienteSelecionado}
                onClienteSelecionadoIdChange={setClienteSelecionadoId}
                onBuscaInfoClienteLinhaChange={setBuscaInfoClienteLinha}
                onEditarClienteSelecionado={editarCliente}
                onExcluirClienteSelecionado={solicitarExclusaoCliente}
                onCancelarEdicaoCliente={cancelarEdicaoCliente}
                onSalvarEdicaoCliente={salvarEdicaoCliente}
                onClienteEdicaoFormChange={atualizarClienteEdicaoForm}
              />
              <Pagination
                page={linhasInfoClientePaginadas.page}
                totalPages={linhasInfoClientePaginadas.totalPages}
                totalItems={linhasInfoClientePaginadas.totalItems}
                onPageChange={setPaginaInfoClienteLinhas}
              />
            </>
          ) : null}

          {abaAtiva === 'infoLinha' ? (
            <>
              <InfoLinhaTab
                linhasInfoFiltradas={linhasInfoPaginadas.items}
                clientes={clientes}
                linhaEmEdicaoId={linhaEmEdicao}
                linhaEdicaoForm={linhaEdicaoForm}
                contasDaLinhaEmEdicao={contasDaLinhaEmEdicao}
                buscaInfoLinha={buscaInfoLinha}
                onBuscaInfoLinhaChange={setBuscaInfoLinha}
                onEditarLinha={editarLinha}
                onExcluirLinha={solicitarExclusaoLinha}
                onCancelarEdicaoLinha={cancelarEdicaoLinha}
                onSalvarEdicaoLinha={salvarEdicaoLinha}
                onLinhaEdicaoFormChange={atualizarLinhaEdicaoForm}
              />
              <Pagination
                page={linhasInfoPaginadas.page}
                totalPages={linhasInfoPaginadas.totalPages}
                totalItems={linhasInfoPaginadas.totalItems}
                onPageChange={setPaginaInfoLinha}
              />
            </>
          ) : null}

          {abaAtiva === 'contas' ? (
            <>
              <ContasTab
                contasFiltradas={contasPaginadas.items}
                clientes={clientes}
                linhas={linhas}
                buscaContas={buscaContas}
                onBuscaContasChange={setBuscaContas}
                onCriarConta={criarConta}
                onConsolidarConta={consolidarConta}
                onSalvarConta={salvarConta}
                onDeletarConta={deletarConta}
              />
              <Pagination
                page={contasPaginadas.page}
                totalPages={contasPaginadas.totalPages}
                totalItems={contasPaginadas.totalItems}
                onPageChange={setPaginaContas}
              />
            </>
          ) : null}
        </section>
      </section>

      {toasts.length > 0 ? (
        <section className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <article key={toast.id} className={`toast toast-${toast.tone}`}>
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() =>
                  setToasts((estadoAtual) =>
                    estadoAtual.filter((item) => item.id !== toast.id),
                  )
                }
              >
                x
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {confirmDelete ? (
        <div
          className="edit-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmDelete(null)
            }
          }}
        >
          <article className="panel-card edit-modal-card confirm-modal">
            <h3>{confirmDelete.title}</h3>
            <p>{confirmDelete.description}</p>
            <div className="actions-cell">
              <button className="ghost-button" type="button" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={confirmarExclusao}
                disabled={confirmDelete.blocked}
              >
                Confirmar exclusao
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  )
}

export default Homepage
