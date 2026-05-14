import { getRuntimeConfig } from './runtimeConfig'

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  get googleClientId() {
    return getRuntimeConfig().googleClientId ?? ''
  },
}
