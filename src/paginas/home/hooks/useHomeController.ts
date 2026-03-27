import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiRequest } from '../api'
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
} from '../types'
import {
  diasParaVencimento,
  isValidCpfOrCnpj,
  maskCpfOrCnpj,
  normalizeSearch,
  paginate,
} from '../utils'

export type ConfirmDeleteState =
  | {
      type: 'cliente' | 'linha'
      id: number
      title: string
      description: string
      blocked: boolean
    }
  | null

export type Toast = {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

export function useHomeController() {
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
  const [clienteEdicaoForm, setClienteEdicaoForm] = useState<ClienteFormState>(
    emptyClienteForm,
  )
  const [linhaForm, setLinhaForm] = useState<LinhaFormState>(emptyLinhaForm)
  const [linhaEdicaoForm, setLinhaEdicaoForm] = useState<LinhaFormState>(emptyLinhaForm)
  const [feedbackPainel, setFeedbackPainel] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null)
  const [notificacoesFechadas, setNotificacoesFechadas] = useState<number[]>([])

  const [paginaClientes, setPaginaClientes] = useState(1)
  const [paginaLinhas, setPaginaLinhas] = useState(1)
  const [paginaInfoClienteLinhas, setPaginaInfoClienteLinhas] = useState(1)
  const [paginaInfoLinha, setPaginaInfoLinha] = useState(1)
  const [paginaContas, setPaginaContas] = useState(1)

  const showToast = (message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((estadoAtual) => [...estadoAtual, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((estadoAtual) => estadoAtual.filter((toast) => toast.id !== id))
    }, 3200)
  }

  const atualizarClienteForm = (field: keyof ClienteFormState, value: string) => {
    const nextValue = field === 'cnpj' ? maskCpfOrCnpj(value) : value
    setClienteForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: nextValue,
    }))
  }

  const atualizarClienteEdicaoForm = (field: keyof ClienteFormState, value: string) => {
    const nextValue = field === 'cnpj' ? maskCpfOrCnpj(value) : value
    setClienteEdicaoForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: nextValue,
    }))
  }

  const atualizarLinhaForm = <K extends keyof LinhaFormState>(
    field: K,
    value: LinhaFormState[K],
  ) => {
    const nextValue =
      (field === 'valorMem' || field === 'valorCliente') && typeof value === 'string'
        ? (value.replace(',', '.') as LinhaFormState[K])
        : value

    setLinhaForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: nextValue,
    }))
  }

  const atualizarLinhaEdicaoForm = <K extends keyof LinhaFormState>(
    field: K,
    value: LinhaFormState[K],
  ) => {
    const nextValue =
      (field === 'valorMem' || field === 'valorCliente') && typeof value === 'string'
        ? (value.replace(',', '.') as LinhaFormState[K])
        : value

    setLinhaEdicaoForm((estadoAtual) => ({
      ...estadoAtual,
      [field]: nextValue,
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

  useEffect(() => {
    if (!feedbackPainel) return
    const tone = /falha|erro|invalido|nao e possivel/i.test(feedbackPainel)
      ? 'error'
      : /sucesso|cadastrado|atualizada|atualizado|removida|removido/i.test(feedbackPainel)
        ? 'success'
        : 'info'
    showToast(feedbackPainel, tone)
    setFeedbackPainel('')
  }, [feedbackPainel])

  useEffect(() => {
    if (!confirmDelete) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmDelete(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmDelete])

  useEffect(() => {
    setPaginaClientes(1)
  }, [buscaCliente, clientes.length])

  useEffect(() => {
    setPaginaLinhas(1)
  }, [buscaLinha, linhas.length])

  useEffect(() => {
    setPaginaInfoClienteLinhas(1)
  }, [buscaInfoClienteLinha, clienteSelecionadoId, linhas.length])

  useEffect(() => {
    setPaginaInfoLinha(1)
  }, [buscaInfoLinha, linhas.length])

  useEffect(() => {
    setPaginaContas(1)
  }, [buscaContas, contas.length])

  const clientesFiltrados = useMemo(() => {
    const termo = normalizeSearch(buscaCliente)
    if (!termo) return clientes

    return clientes.filter((cliente) => {
      const texto = normalizeSearch(`${cliente.nome} ${cliente.nomeFantasia} ${cliente.cnpj}`)
      return texto.includes(termo)
    })
  }, [buscaCliente, clientes])

  const linhasFiltradas = useMemo(() => {
    const termo = normalizeSearch(buscaLinha)
    if (!termo) return linhas

    return linhas.filter((linha) => {
      const cliente = clientes.find((item) => item.id === linha.clienteId)
      const texto = normalizeSearch(
        `${linha.numero} ${linha.usuario} ${cliente?.nomeFantasia ?? ''}`,
      )
      return texto.includes(termo)
    })
  }, [buscaLinha, linhas, clientes])

  const clienteSelecionado =
    clientes.find((cliente) => cliente.id === clienteSelecionadoId) ?? null

  const linhasDoClienteSelecionado = useMemo(() => {
    const termo = normalizeSearch(buscaInfoClienteLinha)
    const somenteCliente = linhas.filter(
      (linha) => linha.clienteId === clienteSelecionadoId,
    )

    if (!termo) return somenteCliente

    return somenteCliente.filter((linha) => {
      const texto = normalizeSearch(`${linha.numero} ${linha.usuario}`)
      return texto.includes(termo)
    })
  }, [buscaInfoClienteLinha, clienteSelecionadoId, linhas])

  const contasDoClienteSelecionado = useMemo(
    () => contas.filter((conta) => conta.clienteId === clienteSelecionadoId),
    [clienteSelecionadoId, contas],
  )

  const contasDaLinhaEmEdicao = useMemo(() => {
    if (!linhaEmEdicao) return []
    return contas.filter((conta) => conta.linhaId === linhaEmEdicao)
  }, [contas, linhaEmEdicao])

  const linhasInfoFiltradas = useMemo(() => {
    const termo = normalizeSearch(buscaInfoLinha)
    if (!termo) return linhas

    return linhas.filter((linha) => {
      const texto = normalizeSearch(`${linha.numero} ${linha.usuario}`)
      return texto.includes(termo)
    })
  }, [buscaInfoLinha, linhas])

  const contasFiltradas = useMemo(() => {
    const termo = normalizeSearch(buscaContas)
    if (!termo) return contas

    return contas.filter((conta) => {
      const cliente = clientes.find((item) => item.id === conta.clienteId)
      const linha = linhas.find((item) => item.id === conta.linhaId)
      const texto = normalizeSearch(`${cliente?.nomeFantasia ?? ''} ${linha?.numero ?? ''}`)
      return texto.includes(termo)
    })
  }, [buscaContas, contas, clientes, linhas])

  const clientesPaginados = useMemo(
    () => paginate(clientesFiltrados, paginaClientes, 8),
    [clientesFiltrados, paginaClientes],
  )
  const linhasPaginadas = useMemo(
    () => paginate(linhasFiltradas, paginaLinhas, 8),
    [linhasFiltradas, paginaLinhas],
  )
  const linhasInfoClientePaginadas = useMemo(
    () => paginate(linhasDoClienteSelecionado, paginaInfoClienteLinhas, 8),
    [linhasDoClienteSelecionado, paginaInfoClienteLinhas],
  )
  const linhasInfoPaginadas = useMemo(
    () => paginate(linhasInfoFiltradas, paginaInfoLinha, 9),
    [linhasInfoFiltradas, paginaInfoLinha],
  )
  const contasPaginadas = useMemo(
    () => paginate(contasFiltradas, paginaContas, 10),
    [contasFiltradas, paginaContas],
  )

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
      setFeedbackPainel('Preencha nome, nome fantasia e CPF ou CNPJ para salvar o cliente.')
      return
    }

    if (!isValidCpfOrCnpj(clienteForm.cnpj)) {
      setFeedbackPainel('Informe um CPF ou CNPJ valido para salvar o cliente.')
      return
    }

    try {
      const payload: ClientePayload = {
        nome: clienteForm.nome.trim(),
        nomeFantasia: clienteForm.nomeFantasia.trim(),
        cnpj: clienteForm.cnpj.trim(),
      }

      await apiRequest('/clientes', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setFeedbackPainel('Cliente cadastrado com sucesso.')

      setClienteForm(emptyClienteForm())
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar cliente.'
      setFeedbackPainel(message)
    }
  }

  const editarCliente = (cliente: Cliente) => {
    setClienteEdicaoForm({
      nome: cliente.nome,
      nomeFantasia: cliente.nomeFantasia,
      cnpj: cliente.cnpj,
    })
    setClienteEmEdicao(cliente.id)
    setClienteSelecionadoId(cliente.id)
  }

  const cancelarEdicaoCliente = () => {
    setClienteEmEdicao(null)
    setClienteEdicaoForm(emptyClienteForm())
  }

  const salvarEdicaoCliente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!clienteEmEdicao) {
      setFeedbackPainel('Selecione um cliente para editar.')
      return
    }

    if (
      !clienteEdicaoForm.nome.trim() ||
      !clienteEdicaoForm.nomeFantasia.trim() ||
      !clienteEdicaoForm.cnpj.trim()
    ) {
      setFeedbackPainel(
        'Preencha nome, nome fantasia e CPF ou CNPJ para atualizar o cliente.',
      )
      return
    }

    if (!isValidCpfOrCnpj(clienteEdicaoForm.cnpj)) {
      setFeedbackPainel('Informe um CPF ou CNPJ valido para atualizar o cliente.')
      return
    }

    try {
      const payload: ClientePayload = {
        nome: clienteEdicaoForm.nome.trim(),
        nomeFantasia: clienteEdicaoForm.nomeFantasia.trim(),
        cnpj: clienteEdicaoForm.cnpj.trim(),
      }

      await apiRequest(`/clientes/${clienteEmEdicao}`, {
        method: 'PUT',
        headers: { 'x-user': 'Ednei' },
        body: JSON.stringify(payload),
      })

      setFeedbackPainel('Cliente atualizado com sucesso.')
      cancelarEdicaoCliente()
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar cliente.'
      setFeedbackPainel(message)
    }
  }

  const excluirCliente = async (id: number) => {
    try {
      await apiRequest(`/clientes/${id}`, { method: 'DELETE' })
      setFeedbackPainel('Cliente removido com sucesso.')
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao remover cliente.'
      setFeedbackPainel(message)
    }
  }

  const excluirClienteSelecionado = async (id: number) => {
    await excluirCliente(id)
    if (clienteEmEdicao === id) {
      cancelarEdicaoCliente()
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

    if (
      Number.isNaN(valorMem) ||
      Number.isNaN(valorCliente) ||
      valorMem < 0 ||
      valorCliente <= 0
    ) {
      setFeedbackPainel('Informe valores numericos validos para a linha.')
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

      await apiRequest('/linhas', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setFeedbackPainel('Linha cadastrada com sucesso.')

      setLinhaForm(emptyLinhaForm(clientes[0]?.id ?? 1))
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar linha.'
      setFeedbackPainel(message)
    }
  }

  const editarLinha = (linha: Linha) => {
    setLinhaEdicaoForm({
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
  }

  const cancelarEdicaoLinha = () => {
    setLinhaEmEdicao(null)
    setLinhaEdicaoForm(emptyLinhaForm(clientes[0]?.id ?? 1))
  }

  const salvarEdicaoLinha = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!linhaEmEdicao) {
      setFeedbackPainel('Selecione uma linha para editar.')
      return
    }

    const valorMem = Number(linhaEdicaoForm.valorMem)
    const valorCliente = Number(linhaEdicaoForm.valorCliente)

    if (
      !linhaEdicaoForm.numero.trim() ||
      !linhaEdicaoForm.usuario.trim() ||
      !linhaEdicaoForm.fidelidade ||
      !linhaEdicaoForm.dataPagamento ||
      !linhaEdicaoForm.contaLinha.trim() ||
      !linhaEdicaoForm.empresa.trim()
    ) {
      setFeedbackPainel('Preencha todos os campos da linha antes de salvar.')
      return
    }

    if (
      Number.isNaN(valorMem) ||
      Number.isNaN(valorCliente) ||
      valorMem < 0 ||
      valorCliente <= 0
    ) {
      setFeedbackPainel('Informe valores numericos validos para a linha.')
      return
    }

    if (valorCliente < valorMem) {
      setFeedbackPainel(
        'Regra de negocio: valor cobrado deve ser maior ou igual ao valor MEM.',
      )
      return
    }

    const clienteValido = clientes.some((cliente) => cliente.id === linhaEdicaoForm.clienteId)
    if (!clienteValido) {
      setFeedbackPainel('Selecione um cliente valido para a linha.')
      return
    }

    try {
      const payload: LinhaPayload = {
        numero: linhaEdicaoForm.numero.trim(),
        valorMem: String(valorMem),
        valorCliente: String(valorCliente),
        usuario: linhaEdicaoForm.usuario.trim(),
        fidelidade: linhaEdicaoForm.fidelidade,
        clienteId: linhaEdicaoForm.clienteId,
        dataPagamento: linhaEdicaoForm.dataPagamento,
        contaLinha: linhaEdicaoForm.contaLinha.trim(),
        empresa: linhaEdicaoForm.empresa.trim(),
        ativa: linhaEdicaoForm.ativa,
      }

      await apiRequest(`/linhas/${linhaEmEdicao}`, {
        method: 'PUT',
        headers: { 'x-user': 'Ednei' },
        body: JSON.stringify(payload),
      })

      setFeedbackPainel('Linha atualizada com sucesso.')
      cancelarEdicaoLinha()
      await carregarDados()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar linha.'
      setFeedbackPainel(message)
    }
  }

  const excluirLinha = async (id: number) => {
    try {
      await apiRequest(`/linhas/${id}`, { method: 'DELETE' })
      setFeedbackPainel('Linha removida com sucesso.')
      if (linhaEmEdicao === id) {
        cancelarEdicaoLinha()
      }
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
      setFeedbackPainel('Conta consolidada com sucesso.')
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
      setFeedbackPainel('Conta atualizada com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao renovar conta.'
      setFeedbackPainel(message)
    }
  }

  const deletarConta = async (id: number) => {
    try {
      await apiRequest(`/contas/${id}`, { method: 'DELETE' })
      setContas((estadoAtual) => estadoAtual.filter((conta) => conta.id !== id))
      setFeedbackPainel('Conta removida com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao apagar conta.'
      setFeedbackPainel(message)
    }
  }

  const solicitarExclusaoCliente = (id: number) => {
    const totalLinhas = linhas.filter((linha) => linha.clienteId === id).length
    const totalContas = contas.filter((conta) => conta.clienteId === id).length
    const blocked = totalLinhas > 0

    setConfirmDelete({
      type: 'cliente',
      id,
      blocked,
      title: 'Confirmar exclusao de cliente',
      description: blocked
        ? `Este cliente possui ${totalLinhas} linha(s) e ${totalContas} conta(s). Remova as linhas antes de excluir.`
        : `Este cliente possui ${totalContas} conta(s) historica(s). Deseja excluir mesmo assim?`,
    })
  }

  const solicitarExclusaoLinha = (id: number) => {
    const totalContas = contas.filter((conta) => conta.linhaId === id).length
    setConfirmDelete({
      type: 'linha',
      id,
      blocked: false,
      title: 'Confirmar exclusao de linha',
      description: `Esta linha possui ${totalContas} conta(s) vinculada(s). Elas serao removidas junto com a linha.`,
    })
  }

  const confirmarExclusao = async () => {
    if (!confirmDelete || confirmDelete.blocked) return

    if (confirmDelete.type === 'cliente') {
      await excluirClienteSelecionado(confirmDelete.id)
    }

    if (confirmDelete.type === 'linha') {
      await excluirLinha(confirmDelete.id)
    }

    setConfirmDelete(null)
  }

  return {
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
  }
}
