export type RuntimeConfig = {
  googleClientId?: string
}

let cachedConfig: RuntimeConfig | null = null
let inFlight: Promise<RuntimeConfig> | null = null

function getConfigUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}config.json`
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const res = await fetch(getConfigUrl(), { cache: 'no-store' })
      if (!res.ok) {
        cachedConfig = {}
        return cachedConfig
      }

      const json: unknown = await res.json()
      cachedConfig = json && typeof json === 'object' ? (json as RuntimeConfig) : {}
      return cachedConfig
    } catch {
      cachedConfig = {}
      return cachedConfig
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

export function getRuntimeConfig(): RuntimeConfig {
  return cachedConfig ?? {}
}

