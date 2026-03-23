import type { ApiError } from './types'

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

export const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
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