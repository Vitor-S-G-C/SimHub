
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type Aba = 'clientes' | 'linhas' | 'infoCliente' | 'infoLinha' | 'contas'

type Cliente = {
  id: number
  nome: string
  nomeFantasia: string
  cnpj: string
}

type Linha = {
  id: number
  numero: string
  valorMem: number
  valorCliente: number
  usuario: string
  fidelidade: string
  clienteId: number
  dataPagamento: string
  contaLinha: string
  empresa: string
  ativa: boolean
}

type ContaReceber = {
  id: number
  linhaId: number
  clienteId: number
  valor: number
  dataVencimento: string
  status: 'aberto' | 'consolidado'
}

type ClientePayload = {
  nome: string
  nomeFantasia: string
  cnpj: string
}

type LinhaPayload = {
  numero: string
  valorMem: string
  valorCliente: string
  usuario: string
  fidelidade: string
  clienteId: number
  dataPagamento: string
  contaLinha: string
  empresa: string
  ativa: boolean
}

type ApiError = {
  message?: string
}

type LoginResponse = {
  nomeFantasia: string
}

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

const readApiError = async (response: Response) => {
  try {
    const errorData = (await response.json()) as ApiError
    return errorData.message ?? 'Erro ao processar requisicao.'
  } catch {
    return 'Erro ao processar requisicao.'
  }
}

const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const toCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const diasParaVencimento = (data: string) => {
  const hoje = new Date()
  const vencimento = new Date(`${data}T00:00:00`)
  const diff = vencimento.getTime() - hoje.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function Homepage() {
  const [logado, setLogado] = useState(false)
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
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

  const [clienteForm, setClienteForm] = useState({
    nome: '',
    nomeFantasia: '',
    cnpj: '',
  })
  const [linhaForm, setLinhaForm] = useState({
    numero: '',
    valorMem: '',
    valorCliente: '',
    usuario: '',
    fidelidade: '',
    clienteId: 1,
    dataPagamento: '',
    contaLinha: '',
    empresa: '',
    ativa: true,
  })
  const [feedbackPainel, setFeedbackPainel] = useState('')

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
    if (logado) {
      void carregarDados()
    }
  }, [carregarDados, logado])

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nomeNormalizado = nomeFantasia.trim()

    if (!nomeNormalizado || !senha.trim()) {
      setMensagem('Preencha o nome fantasia e a senha para continuar.')
      return
    }

    try {
      const resposta = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ nomeFantasia: nomeNormalizado, senha: senha.trim() }),
      })

      setMensagem(`Acesso liberado para ${resposta.nomeFantasia}.`)
      setLogado(true)
      setFeedbackPainel('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no login.'
      setMensagem(message)
      setLogado(false)
    }
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

      setClienteForm({ nome: '', nomeFantasia: '', cnpj: '' })
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
      setLinhaForm({
        numero: '',
        valorMem: '',
        valorCliente: '',
        usuario: '',
        fidelidade: '',
        clienteId: clientes[0]?.id ?? 1,
        dataPagamento: '',
        contaLinha: '',
        empresa: '',
        ativa: true,
      })
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

  if (!logado) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="login-copy">
            <span className="login-badge">HELIX</span>
            <h1>Painel de acesso</h1>
            <p>
              Entre com o nome fantasia e a senha para acessar sua area de
              gestao.
            </p>

            <div className="login-highlights" aria-hidden="true">
              <div>
                <strong>Clientes</strong>
                <span>Controle completo de contas e linhas vinculadas.</span>
              </div>
              <div>
                <strong>Financeiro</strong>
                <span>Visao das cobrancas abertas e consolidadas.</span>
              </div>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-group" htmlFor="nomeFantasia">
              <span>Nome fantasia</span>
              <input
                id="nomeFantasia"
                name="nomeFantasia"
                type="text"
                placeholder="Digite o nome fantasia"
                value={nomeFantasia}
                onChange={(event) => setNomeFantasia(event.target.value)}
              />
            </label>

            <label className="field-group" htmlFor="senha">
              <span>Senha</span>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
            </label>

            <button type="submit" className="login-button">
              Entrar
            </button>

            {mensagem ? (
              <p className="login-feedback" role="status">
                {mensagem}
              </p>
            ) : null}
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="helix-shell">
      <header className="helix-topbar">
        <div>
          <span className="login-badge">HELIX SaaS</span>
          <h2>Gestao de linhas e cobranca</h2>
          <p>Nome fantasia autenticado: {nomeFantasia}</p>
        </div>
        <button className="ghost-button" onClick={() => setLogado(false)}>
          Sair
        </button>
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

      {notificacoes.length > 0 ? (
        <section className="notification-strip" role="status">
          {notificacoes.slice(0, 3).map((conta) => {
            const cliente = clientes.find((item) => item.id === conta.clienteId)
            const linha = linhas.find((item) => item.id === conta.linhaId)
            const dias = diasParaVencimento(conta.dataVencimento)

            return (
              <p key={conta.id}>
                Vencimento proximo: {cliente?.nomeFantasia} / {linha?.numero} em {dias} dia(s).
              </p>
            )
          })}
        </section>
      ) : null}

      <nav className="tab-nav" aria-label="Navegacao principal">
        <button
          className={abaAtiva === 'clientes' ? 'tab active' : 'tab'}
          onClick={() => setAbaAtiva('clientes')}
        >
          Clientes
        </button>
        <button
          className={abaAtiva === 'linhas' ? 'tab active' : 'tab'}
          onClick={() => setAbaAtiva('linhas')}
        >
          Linhas
        </button>
        <button
          className={abaAtiva === 'infoCliente' ? 'tab active' : 'tab'}
          onClick={() => setAbaAtiva('infoCliente')}
        >
          Info Cliente
        </button>
        <button
          className={abaAtiva === 'infoLinha' ? 'tab active' : 'tab'}
          onClick={() => setAbaAtiva('infoLinha')}
        >
          Info Linha
        </button>
        <button
          className={abaAtiva === 'contas' ? 'tab active' : 'tab'}
          onClick={() => setAbaAtiva('contas')}
        >
          Contas a Receber
        </button>
      </nav>

      <section className="panel-area">
        {carregandoDados ? <p className="login-feedback">Carregando dados...</p> : null}

        {abaAtiva === 'clientes' ? (
          <div className="panel-grid two-columns">
            <article className="panel-card">
              <h3>{clienteEmEdicao ? 'Editar cliente' : 'Cadastrar cliente'}</h3>
              <form className="stack-form" onSubmit={salvarCliente}>
                <input
                  type="text"
                  placeholder="Nome"
                  value={clienteForm.nome}
                  onChange={(event) =>
                    setClienteForm((estadoAtual) => ({
                      ...estadoAtual,
                      nome: event.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Nome fantasia"
                  value={clienteForm.nomeFantasia}
                  onChange={(event) =>
                    setClienteForm((estadoAtual) => ({
                      ...estadoAtual,
                      nomeFantasia: event.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="CNPJ"
                  value={clienteForm.cnpj}
                  onChange={(event) =>
                    setClienteForm((estadoAtual) => ({
                      ...estadoAtual,
                      cnpj: event.target.value,
                    }))
                  }
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
                onChange={(event) => setBuscaCliente(event.target.value)}
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
                          <button onClick={() => editarCliente(cliente)}>Editar</button>
                          <button onClick={() => excluirCliente(cliente.id)}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        ) : null}

        {abaAtiva === 'linhas' ? (
          <div className="panel-grid two-columns">
            <article className="panel-card">
              <h3>{linhaEmEdicao ? 'Editar linha' : 'Cadastrar linha'}</h3>
              <form className="stack-form" onSubmit={salvarLinha}>
                <input
                  type="text"
                  placeholder="Numero da linha"
                  value={linhaForm.numero}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      numero: event.target.value,
                    }))
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor pago MEM"
                  value={linhaForm.valorMem}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      valorMem: event.target.value,
                    }))
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor cobrado cliente"
                  value={linhaForm.valorCliente}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      valorCliente: event.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Usuario da linha"
                  value={linhaForm.usuario}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      usuario: event.target.value,
                    }))
                  }
                />
                <input
                  type="date"
                  value={linhaForm.fidelidade}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      fidelidade: event.target.value,
                    }))
                  }
                />
                <select
                  value={linhaForm.clienteId}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      clienteId: Number(event.target.value),
                    }))
                  }
                >
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nomeFantasia}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={linhaForm.dataPagamento}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      dataPagamento: event.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Conta da linha"
                  value={linhaForm.contaLinha}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      contaLinha: event.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Empresa registrada"
                  value={linhaForm.empresa}
                  onChange={(event) =>
                    setLinhaForm((estadoAtual) => ({
                      ...estadoAtual,
                      empresa: event.target.value,
                    }))
                  }
                />
                <label className="toggle-row" htmlFor="ativa">
                  <span>Linha ativa</span>
                  <input
                    id="ativa"
                    type="checkbox"
                    checked={linhaForm.ativa}
                    onChange={(event) =>
                      setLinhaForm((estadoAtual) => ({
                        ...estadoAtual,
                        ativa: event.target.checked,
                      }))
                    }
                  />
                </label>
                <button className="primary-button" type="submit">
                  {linhaEmEdicao ? 'Salvar alteracoes' : 'Cadastrar'}
                </button>
              </form>
            </article>

            <article className="panel-card">
              <h3>Linhas cadastradas</h3>
              <input
                type="search"
                placeholder="Buscar por numero, usuario ou cliente"
                value={buscaLinha}
                onChange={(event) => setBuscaLinha(event.target.value)}
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
                          <td className="actions-cell">
                            <button onClick={() => editarLinha(linha)}>Editar</button>
                            <button onClick={() => excluirLinha(linha.id)}>Excluir</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        ) : null}

        {abaAtiva === 'infoCliente' ? (
          <article className="panel-card">
            <h3>Pagina de informacoes do cliente</h3>
            <div className="inline-filters">
              <select
                value={clienteSelecionadoId}
                onChange={(event) => setClienteSelecionadoId(Number(event.target.value))}
              >
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nomeFantasia}
                  </option>
                ))}
              </select>
              <input
                type="search"
                placeholder="Pesquisar por numero ou usuario"
                value={buscaInfoClienteLinha}
                onChange={(event) => setBuscaInfoClienteLinha(event.target.value)}
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
        ) : null}

        {abaAtiva === 'infoLinha' ? (
          <article className="panel-card">
            <h3>Pagina de informacoes da linha</h3>
            <input
              type="search"
              placeholder="Pesquisar por numero ou usuario"
              value={buscaInfoLinha}
              onChange={(event) => setBuscaInfoLinha(event.target.value)}
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
                    <p>Fidelidade: {linha.fidelidade}</p>
                    <p>Pagamento: {linha.dataPagamento}</p>
                    <p>Valor MEM: {toCurrency(linha.valorMem)}</p>
                    <p>Valor Cliente: {toCurrency(linha.valorCliente)}</p>
                    <p>Status: {linha.ativa ? 'Ativa' : 'Inativa (mantida para historico)'}</p>
                  </article>
                )
              })}
            </div>
          </article>
        ) : null}

        {abaAtiva === 'contas' ? (
          <article className="panel-card">
            <h3>Contas a receber</h3>
            <input
              type="search"
              placeholder="Pesquisar por linha ou nome do cliente"
              value={buscaContas}
              onChange={(event) => setBuscaContas(event.target.value)}
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
                    <th>Baixa</th>
                  </tr>
                </thead>
                <tbody>
                  {contasFiltradas.map((conta) => {
                    const cliente = clientes.find((item) => item.id === conta.clienteId)
                    const linha = linhas.find((item) => item.id === conta.linhaId)

                    return (
                      <tr key={conta.id}>
                        <td>{cliente?.nomeFantasia ?? '-'}</td>
                        <td>{linha?.numero ?? '-'}</td>
                        <td>{toCurrency(conta.valor)}</td>
                        <td>{conta.dataVencimento}</td>
                        <td>
                          <span
                            className={
                              conta.status === 'aberto' ? 'status-open' : 'status-done'
                            }
                          >
                            {conta.status}
                          </span>
                        </td>
                        <td>
                          {conta.status === 'aberto' ? (
                            <button onClick={() => consolidarConta(conta.id)}>
                              Consolidar
                            </button>
                          ) : (
                            <span>Ok</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {feedbackPainel ? <p className="login-feedback">{feedbackPainel}</p> : null}
      </section>
    </main>
  )
}

export default Homepage