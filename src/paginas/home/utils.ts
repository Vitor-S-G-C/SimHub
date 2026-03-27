export const toCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const toDateBr = (value: string) => {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

export const maskCpfOrCnpj = (value: string) => {
  const onlyDigits = value.replace(/\D/g, '').slice(0, 14)

  if (onlyDigits.length <= 11) {
    return onlyDigits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return onlyDigits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const isValidCpf = (value: string) => {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false

  const calcDigit = (base: string, factor: number) => {
    const sum = base
      .split('')
      .reduce((acc, digit) => {
        const result = acc + Number(digit) * factor
        factor -= 1
        return result
      }, 0)
    const result = (sum * 10) % 11
    return result === 10 ? 0 : result
  }

  const d1 = calcDigit(cpf.slice(0, 9), 10)
  const d2 = calcDigit(cpf.slice(0, 10), 11)

  return cpf.endsWith(`${d1}${d2}`)
}

const isValidCnpj = (value: string) => {
  const cnpj = value.replace(/\D/g, '')
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  const calcDigit = (base: string, factors: number[]) => {
    const sum = base
      .split('')
      .reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0)
    const result = 11 - (sum % 11)
    return result > 9 ? 0 : result
  }

  const d1 = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calcDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return cnpj.endsWith(`${d1}${d2}`)
}

export const isValidCpfOrCnpj = (value: string) => {
  const onlyDigits = value.replace(/\D/g, '')
  if (onlyDigits.length === 11) return isValidCpf(value)
  if (onlyDigits.length === 14) return isValidCnpj(value)
  return false
}

export const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const safePageSize = pageSize <= 0 ? 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * safePageSize

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    totalPages,
    totalItems: items.length,
  }
}

export const diasParaVencimento = (data: string) => {
  const hoje = new Date()
  const vencimento = new Date(`${data}T00:00:00`)
  const diff = vencimento.getTime() - hoje.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const toDateTimeBr = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}