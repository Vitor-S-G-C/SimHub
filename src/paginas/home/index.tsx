
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiRequest } from './api'
import { ClientesTab } from './components/ClientesTab'
import { ContasTab } from './components/ContasTab'
import { InfoClienteTab } from './components/InfoClienteTab'
import { InfoLinhaTab } from './components/InfoLinhaTab'
import { LinhasTab } from './components/LinhasTab'
import { TabNav } from './components/TabNav'
import {
  type Aba,
  type Cliente,
  type ClienteFormState,
  type ClientePayload,
  type ContaReceber,
  type Linha,
  type LinhaFormState,
  type LinhaPayload,
  type NovaContaPayload,
  type RenovarContaPayload,
  emptyClienteForm,
  emptyLinhaForm,
} from './types'
import { diasParaVencimento, toCurrency } from './utils'

function Homepage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('clientes')

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)

  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaLinha, setBuscaLinha] = useState('')
  const [buscaInfoClienteLinha, setBuscaInfoClienteLinha] = useState('')
  const [buscaInfoLinha, setBuscaInfoLinha] = useState('')
  const [buscaContas, setBuscaContas] = useState('')

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number>(1)
  const [clienteEmEdicao, setClienteEmEdicao] = useState<number | null>(null)
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<number | null>(null)

  const [clienteForm, setClienteForm] = useState<ClienteFormState>(emptyClienteForm)
  const [linhaForm, setLinhaForm] = useState<LinhaFormState>(emptyLinhaForm)
  const [feedbackPainel, setFeedbackPainel] = useState('')
  const [notificacoesFechadas, setNotificacoesFechadas] = useState<number[]>([])

  const atualizarClienteForm = (field: keyof ClienteFormState, value: string) => {
    setClienteForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: value,
    }))
  }

  const atualizarLinhaForm = <K extends keyof LinhaFormState>(
    field: K,
    value: LinhaFormState[K],
  ) => {
    setLinhaForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: value,
    }))
  }

  const carregarDados = useCallback(async () => {
    setCarregandoDados(true)
    try {
      const [clientesApi, linhasApi, contasApi] = await Promise.all([
        apiRequest<Cliente[]>('/clientes'),
        apiRequest<Linha[]>('/linhas'),
        apiRequest<ContaReceber[]>('/contas'),
      ])

      setClientes(clientesApi)
      setLinhas(linhasApi)
      setContas(contasApi)

      if (clientesApi.length > 0) {
        setClienteSelecionadoId((estadoAtual) => {
          const existeClienteSelecionado = clientesApi.some(
            (cliente) => cliente.id === estadoAtual,
          )
          return existeClienteSelecionado ? estadoAtual : clientesApi[0].id
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar painel.'
      setFeedbackPainel(message)
    } finally {
      setCarregandoDados(false)
    }
  }, [])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  useEffect(() => {
    if (!clientes.length) return

    const clienteSelecionadoExiste = clientes.some(
      (cliente) => cliente.id === linhaForm.clienteId,
    )

    if (!clienteSelecionadoExiste) {
      setLinhaForm((estadoAtual) => ({
        ...estadoAtual,
        clienteId: clientes[0].id,
      }))
    }
  }, [clientes, linhaForm.clienteId])

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase()

    if (!termo) return clientes

    return clientes.filter((cliente) => {
      const texto = `${cliente.nome} ${cliente.nomeFantasia} ${cliente.cnpj}`.toLowerCase()
      return texto.includes(termo)
    })
  }, [buscaCliente, clientes])

  const linhasFiltradas = useMemo(() => {
    const termo = buscaLinha.trim().toLowerCase()

    if (!termo) return linhas

    return linhas.filter((linha) => {
      const cliente = clientes.find((item) => item.id === linha.clienteId)
      const texto = `${linha.numero} ${linha.usuario} ${cliente?.nomeFantasia ?? ''}`.toLowerCase()
      return texto.includes(termo)
    })
  }, [buscaLinha, linhas, clientes])

  const clienteSelecionado =
    clientes.find((cliente) => cliente.id === clienteSelecionadoId) ?? null

  const linhasDoClienteSelecionado = useMemo(() => {
    const termo = buscaInfoClienteLinha.trim().toLowerCase()
    const somenteCliente = linhas.filter(
      (linha) => linha.clienteId === clienteSelecionadoId,
    )

    if (!termo) return somenteCliente

    return somenteCliente.filter((linha) => {
      const texto = `${linha.numero} ${linha.usuario}`.toLowerCase()
      return texto.includes(termo)
    })
  }, [buscaInfoClienteLinha, clienteSelecionadoId, linhas])

  const linhasInfoFiltradas = useMemo(() => {
    const termo = buscaInfoLinha.trim().toLowerCase()

    if (!termo) return linhas

    return linhas.filter((linha) => {
      const texto = `${linha.numero} ${linha.usuario}`.toLowerCase()
      return texto.includes(termo)
    })
  }, [buscaInfoLinha, linhas])

  const contasFiltradas = useMemo(() => {
    const termo = buscaContas.trim().toLowerCase()

    if (!termo) return contas

    return contas.filter((conta) => {
      const cliente = clientes.find((item) => item.id === conta.clienteId)
      const linha = linhas.find((item) => item.id === conta.linhaId)
      const texto = `${cliente?.nomeFantasia ?? ''} ${linha?.numero ?? ''}`.toLowerCase()
      return texto.includes(termo)
    })
  }, [buscaContas, contas, clientes, linhas])

  const notificacoes = useMemo(() => {
    return contas
      .filter((conta) => conta.status === 'aberto')
      .filter((conta) => diasParaVencimento(conta.dataVencimento) <= 5)
  }, [contas])

  const notificacoesVisiveis = useMemo(() => {
    return notificacoes.filter((conta) => !notificacoesFechadas.includes(conta.id))
  }, [notificacoes, notificacoesFechadas])

  useEffect(() => {
    const idsAtivos = new Set(notificacoes.map((conta) => conta.id))
    setNotificacoesFechadas((estadoAtual) =>
      estadoAtual.filter((id) => idsAtivos.has(id)),
    )
  }, [notificacoes])

  const fecharNotificacao = (contaId: number) => {
    setNotificacoesFechadas((estadoAtual) =>
      estadoAtual.includes(contaId) ? estadoAtual : [...estadoAtual, contaId],
    )
  }

  const salvarCliente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !clienteForm.nome.trim() ||
      !clienteForm.nomeFantasia.trim() ||
      !clienteForm.cnpj.trim()
    ) {
      setFeedbackPainel('Preencha nome, nome fantasia e CNPJ para salvar o cliente.')
      return
    }

    try {
      const payload: ClientePayload = {
        nome: clienteForm.nome.trim(),
        nomeFantasia: clienteForm.nomeFantasia.trim(),
        cnpj: clienteForm.cnpj.trim(),
      }

      if (clienteEmEdicao) {
        await apiRequest(`/clientes/${clienteEmEdicao}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setFeedbackPainel('Cliente atualizado com sucesso.')
      } else {
        await apiRequest('/clientes', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setFeedbackPainel('Cliente cadastrado com sucesso.')
      }

      setClienteForm(emptyClienteForm())
      setClienteEmEdicao(null)
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar cliente.'
      setFeedbackPainel(message)
    }
  }

  const editarCliente = (cliente: Cliente) => {
    setClienteForm({
      nome: cliente.nome,
      nomeFantasia: cliente.nomeFantasia,
      cnpj: cliente.cnpj,
    })
    setClienteEmEdicao(cliente.id)
    setFeedbackPainel('Editando cliente selecionado.')
  }

  const excluirCliente = async (id: number) => {
    const clienteTemLinha = linhas.some((linha) => linha.clienteId === id)

    if (clienteTemLinha) {
      setFeedbackPainel('Nao e possivel excluir cliente com linhas vinculadas.')
      return
    }

    try {
      await apiRequest(`/clientes/${id}`, { method: 'DELETE' })
      setFeedbackPainel('Cliente removido com sucesso.')
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao remover cliente.'
      setFeedbackPainel(message)
    }
  }

  const salvarLinha = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const valorMem = Number(linhaForm.valorMem)
    const valorCliente = Number(linhaForm.valorCliente)

    if (
      !linhaForm.numero.trim() ||
      !linhaForm.usuario.trim() ||
      !linhaForm.fidelidade ||
      !linhaForm.dataPagamento ||
      !linhaForm.contaLinha.trim() ||
      !linhaForm.empresa.trim()
    ) {
      setFeedbackPainel('Preencha todos os campos da linha antes de salvar.')
      return
    }

    if (valorCliente < valorMem) {
      setFeedbackPainel(
        'Regra de negocio: valor cobrado deve ser maior ou igual ao valor MEM.',
      )
      return
    }

    if (!clientes.length) {
      setFeedbackPainel('Cadastre pelo menos um cliente antes de criar uma linha.')
      return
    }

    const clienteValido = clientes.some((cliente) => cliente.id === linhaForm.clienteId)
    if (!clienteValido) {
      setFeedbackPainel('Selecione um cliente valido para a linha.')
      return
    }

    try {
      const payload: LinhaPayload = {
        numero: linhaForm.numero.trim(),
        valorMem: String(valorMem),
        valorCliente: String(valorCliente),
        usuario: linhaForm.usuario.trim(),
        fidelidade: linhaForm.fidelidade,
        clienteId: linhaForm.clienteId,
        dataPagamento: linhaForm.dataPagamento,
        contaLinha: linhaForm.contaLinha.trim(),
        empresa: linhaForm.empresa.trim(),
        ativa: linhaForm.ativa,
      }

      if (linhaEmEdicao) {
        await apiRequest(`/linhas/${linhaEmEdicao}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setFeedbackPainel('Linha atualizada com sucesso.')
      } else {
        await apiRequest('/linhas', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setFeedbackPainel('Linha cadastrada com sucesso.')
      }

      setLinhaEmEdicao(null)
      setLinhaForm(emptyLinhaForm(clientes[0]?.id ?? 1))
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar linha.'
      setFeedbackPainel(message)
    }
  }

  const editarLinha = (linha: Linha) => {
    setLinhaForm({
      numero: linha.numero,
      valorMem: String(linha.valorMem),
      valorCliente: String(linha.valorCliente),
      usuario: linha.usuario,
      fidelidade: linha.fidelidade,
      clienteId: linha.clienteId,
      dataPagamento: linha.dataPagamento,
      contaLinha: linha.contaLinha,
      empresa: linha.empresa,
      ativa: linha.ativa,
    })
    setLinhaEmEdicao(linha.id)
    setFeedbackPainel('Editando linha selecionada.')
  }

  const excluirLinha = async (id: number) => {
    try {
      await apiRequest(`/linhas/${id}`, { method: 'DELETE' })
      setFeedbackPainel('Linha removida com sucesso.')
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao remover linha.'
      setFeedbackPainel(message)
    }
  }

  const consolidarConta = async (id: number) => {
    try {
      const contaAtualizada = await apiRequest<ContaReceber>(
        `/contas/${id}/consolidar`,
        { method: 'PATCH' },
      )

      setContas((estadoAtual) =>
        estadoAtual.map((conta) =>
          conta.id === id ? { ...conta, status: contaAtualizada.status } : conta,
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao consolidar conta.'
      setFeedbackPainel(message)
    }
  }

  const criarConta = async (payload: NovaContaPayload) => {
    try {
      const contaCriada = await apiRequest<ContaReceber>('/contas', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setContas((estadoAtual) => [contaCriada, ...estadoAtual])
      setFeedbackPainel('Conta a receber cadastrada com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao cadastrar conta.'
      setFeedbackPainel(message)
    }
  }

  const salvarConta = async (id: number, payload: RenovarContaPayload) => {
    try {
      const contaAtualizada = await apiRequest<ContaReceber>(
        `/contas/${id}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      )
      setContas((estadoAtual) =>
        estadoAtual.map((conta) => (conta.id === id ? contaAtualizada : conta)),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao renovar conta.'
      setFeedbackPainel(message)
    }
  }

  const deletarConta = async (id: number) => {
    try {
      await apiRequest(`/contas/${id}`, { method: 'DELETE' })
      setContas((estadoAtual) => estadoAtual.filter((conta) => conta.id !== id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao apagar conta.'
      setFeedbackPainel(message)
    }
  }

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
          <span>Clientes ativos</span>
          <strong>{clientes.length}</strong>
        </article>
        <article className="stat-card">
          <span>Linhas cadastradas</span>
          <strong>{linhas.length}</strong>
        </article>
        <article className="stat-card">
          <span>Em aberto</span>
          <strong>
            {
              contas.filter((conta) => conta.status === 'aberto').length
            }
          </strong>
        </article>
        <article className="stat-card">
          <span>Receber total</span>
          <strong>{toCurrency(contas.reduce((sum, conta) => sum + conta.valor, 0))}</strong>
        </article>
      </section>

      {notificacoesVisiveis.length > 0 ? (
        <section className="notification-strip" role="status">
          {notificacoesVisiveis.slice(0, 3).map((conta) => {
            const cliente = clientes.find((item) => item.id === conta.clienteId)
            const linha = linhas.find((item) => item.id === conta.linhaId)
            const dias = diasParaVencimento(conta.dataVencimento)

            return (
              <div key={conta.id} className="notification-item">
                <p>
                  Vencimento proximo: {cliente?.nomeFantasia} / {linha?.numero} em {dias} dia(s).
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

      <TabNav abaAtiva={abaAtiva} onChange={setAbaAtiva} />

      <section className="panel-area">
        {carregandoDados ? <p className="login-feedback">Carregando dados...</p> : null}

        {abaAtiva === 'clientes' ? (
          <ClientesTab
            clienteEmEdicao={clienteEmEdicao}
            clienteForm={clienteForm}
            buscaCliente={buscaCliente}
            clientesFiltrados={clientesFiltrados}
            onSubmit={salvarCliente}
            onClienteFormChange={atualizarClienteForm}
            onBuscaClienteChange={setBuscaCliente}
            onEditarCliente={editarCliente}
            onExcluirCliente={excluirCliente}
          />
        ) : null}

        {abaAtiva === 'linhas' ? (
          <LinhasTab
            linhaEmEdicao={linhaEmEdicao}
            linhaForm={linhaForm}
            clientes={clientes}
            buscaLinha={buscaLinha}
            linhasFiltradas={linhasFiltradas}
            onSubmit={salvarLinha}
            onLinhaFormChange={atualizarLinhaForm}
            onBuscaLinhaChange={setBuscaLinha}
            onEditarLinha={editarLinha}
            onExcluirLinha={excluirLinha}
          />
        ) : null}

        {abaAtiva === 'infoCliente' ? (
          <InfoClienteTab
            clientes={clientes}
            clienteSelecionadoId={clienteSelecionadoId}
            clienteSelecionado={clienteSelecionado}
            buscaInfoClienteLinha={buscaInfoClienteLinha}
            linhasDoClienteSelecionado={linhasDoClienteSelecionado}
            onClienteSelecionadoIdChange={setClienteSelecionadoId}
            onBuscaInfoClienteLinhaChange={setBuscaInfoClienteLinha}
          />
        ) : null}

        {abaAtiva === 'infoLinha' ? (
          <InfoLinhaTab
            linhasInfoFiltradas={linhasInfoFiltradas}
            clientes={clientes}
            buscaInfoLinha={buscaInfoLinha}
            onBuscaInfoLinhaChange={setBuscaInfoLinha}
          />
        ) : null}

        {abaAtiva === 'contas' ? (
          <ContasTab
            contasFiltradas={contasFiltradas}
            clientes={clientes}
            linhas={linhas}
            buscaContas={buscaContas}
            onBuscaContasChange={setBuscaContas}
            onCriarConta={criarConta}
            onConsolidarConta={consolidarConta}
            onSalvarConta={salvarConta}
            onDeletarConta={deletarConta}
          />
        ) : null}

        {feedbackPainel ? <p className="login-feedback">{feedbackPainel}</p> : null}
      </section>
    </main>
  )
}

export default Homepage