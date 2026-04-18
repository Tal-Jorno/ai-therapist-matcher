import { env } from './env'

export type ApiClientOptions = {
  baseUrl?: string
  defaultHeaders?: Record<string, string>
}

export class ApiError extends Error {
  public status: number
  public body?: unknown

  constructor(message: string, opts: { status: number; body?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.body = opts.body
  }
}

export function createApiClient(opts: ApiClientOptions = {}) {
  const baseUrl = (opts.baseUrl ?? env.apiBaseUrl).replace(/\/$/, '')
  const defaultHeaders = opts.defaultHeaders ?? {}

  async function request<TResponse>(
    path: string,
    init: RequestInit,
  ): Promise<TResponse> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...defaultHeaders,
        ...(init.headers ?? {}),
      },
    })

    const contentType = res.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const body = isJson ? await res.json().catch(() => undefined) : undefined

    if (!res.ok) {
      throw new ApiError(`API request failed: ${res.status}`, {
        status: res.status,
        body,
      })
    }

    return (body ?? (undefined as TResponse)) as TResponse
  }

  return {
    get: <TResponse>(path: string) => request<TResponse>(path, { method: 'GET' }),
    post: <TResponse, TBody>(path: string, body: TBody) =>
      request<TResponse>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),

    patch: <TResponse, TBody>(path: string, body: TBody) =>
      request<TResponse>(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  }
}

export const api = createApiClient()
