import { Home, LogOut, User } from 'lucide-react'
import { ClientesTab } from './components/ClientesTab'
import { ContasTab } from './components/ContasTab'
import { DashboardTab } from './components/DashboardTab'
import { InfoClienteTab } from './components/InfoClienteTab'
import { InfoLinhaTab } from './components/InfoLinhaTab'
import { LinhasTab } from './components/LinhasTab'
import { Pagination } from './components/Pagination'
import { PerfilTab } from './components/PerfilTab'
import { TabNav } from './components/TabNav'
import { useHomeController } from './hooks/useHomeController'
import { toDateBr } from './utils'

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
    solicitarExclusaoCliente,
    solicitarExclusaoLinha,
    solicitarExclusaoConta,
    confirmarExclusao,
  } = useHomeController()

  return (
    <main className="helix-shell">
      <aside className="helix-sidebar">
        <div className="sidebar-top">
          <button className="sidebar-logo" onClick={() => setAbaAtiva('dashboard')} title="Voltar ao Dashboard">
            <Home size={28} />
          </button>
          <TabNav abaAtiva={abaAtiva} onChange={setAbaAtiva} />
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-sair" onClick={() => window.location.reload()} title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="helix-main">
        <header className="helix-topbar">
          <button className="topbar-user" onClick={() => setAbaAtiva('perfil')} title="Ver perfil">
            <div className="topbar-user-icon">
              <User size={20} />
            </div>
            <div className="topbar-user-info">
              <strong>Ednei</strong>
              <small>Administrador</small>
            </div>
          </button>
        </header>

        <section className="panel-area">
          {carregandoDados ? <p className="login-feedback">Carregando dados...</p> : null}

          {abaAtiva === 'dashboard' ? (
            <DashboardTab
              contas={contas}
              clientes={clientes}
              totalClientes={clientes.length}
              totalLinhas={linhas.length}
            />
          ) : null}

          {abaAtiva === 'perfil' ? (
            <PerfilTab nome="Ednei" cargo="Administrador" />
          ) : null}

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
                onDeletarConta={solicitarExclusaoConta}
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
      </div>

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
