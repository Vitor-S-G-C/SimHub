export type Aba = 'clientes' | 'linhas' | 'infoCliente' | 'infoLinha' | 'contas'

export type Cliente = {
  id: number
  nome: string
  nomeFantasia: string
  cnpj: string
  atualizadoEm: string | null
  atualizadoPor: string | null
}

export type Linha = {
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
  atualizadoEm: string | null
  atualizadoPor: string | null
}

export type ContaReceber = {
  id: number
  linhaId: number | null
  clienteId: number
  valor: number
  dataVencimento: string
  status: 'aberto' | 'consolidado'
}

export type NovaContaPayload = {
  clienteId: number
  valor: number
  dataVencimento: string
}

export type ClientePayload = {
  nome: string
  nomeFantasia: string
  cnpj: string
}

export type LinhaPayload = {
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

export type RenovarContaPayload = {
  dataVencimento: string
  valor: number
}

export type ClienteFormState = {
  nome: string
  nomeFantasia: string
  cnpj: string
}

export type LinhaFormState = {
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

export type ApiError = {
  message?: string
}

export const emptyClienteForm = (): ClienteFormState => ({
  nome: '',
  nomeFantasia: '',
  cnpj: '',
})

export const emptyLinhaForm = (clienteId = 1): LinhaFormState => ({
  numero: '',
  valorMem: '',
  valorCliente: '',
  usuario: '',
  fidelidade: '',
  clienteId,
  dataPagamento: '',
  contaLinha: '',
  empresa: '',
  ativa: true,
})