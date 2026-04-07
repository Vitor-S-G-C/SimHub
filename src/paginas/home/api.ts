import type { ApiError, AuthResponse } from './types'

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

const getToken = () => localStorage.getItem('simhub_token')

export const setToken = (token: string) => localStorage.setItem('simhub_token', token)
export const clearToken = () => localStorage.removeItem('simhub_token')

const readApiError = async (response: Response) => {
  try {
    const errorData = (await response.json()) as ApiError
    return errorData.message ?? 'Erro ao processar requisicao.'
  } catch {
    return 'Erro ao processar requisicao.'
  }
}

export const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const token = getToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (response.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('Sessao expirada. Faca login novamente.')
  }

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const loginRequest = async (login: string, senha: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, senha }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return (await response.json()) as AuthResponse
}