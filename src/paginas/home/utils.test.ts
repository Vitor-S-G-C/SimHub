import { describe, expect, it } from 'vitest'

import {
  isValidCnpj,
  maskCnpj,
  normalizeSearch,
  paginate,
  toDateBr,
} from './utils'

describe('utils', () => {
  it('mascara CNPJ corretamente', () => {
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('valida CNPJ conhecido', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false)
  })

  it('normaliza busca ignorando acentos e pontuacao', () => {
    expect(normalizeSearch('Acao, CNPJ: 11.222')).toBe('acao cnpj 11 222')
  })

  it('formata data para padrao BR', () => {
    expect(toDateBr('2026-03-23')).toBe('23/03/2026')
  })

  it('pagina resultados sem estourar limites', () => {
    const result = paginate([1, 2, 3, 4, 5], 3, 2)
    expect(result.items).toEqual([5])
    expect(result.page).toBe(3)
    expect(result.totalPages).toBe(3)
  })
})
