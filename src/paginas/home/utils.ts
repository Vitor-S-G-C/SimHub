export const toCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const diasParaVencimento = (data: string) => {
  const hoje = new Date()
  const vencimento = new Date(`${data}T00:00:00`)
  const diff = vencimento.getTime() - hoje.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}