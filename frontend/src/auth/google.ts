// Minimal Google sign-in helper.
// Uses Google Identity Services if it exists on window.

type GoogleId = {
  accounts?: {
    id?: {
      initialize?: (opts: { client_id: string; callback: (res: { credential?: string }) => void }) => void
      prompt?: () => void
    }
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve()

    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.defer = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(el)
  })
}

export async function googlePromptForIdToken(opts: { clientId: string }): Promise<string> {
  await loadScript('https://accounts.google.com/gsi/client')

  const google = (window as unknown as { google?: GoogleId }).google
  if (!google?.accounts?.id?.initialize || !google.accounts.id.prompt) {
    throw new Error('Google Identity Services not available')
  }

  return new Promise((resolve, reject) => {
    google.accounts!.id!.initialize!({
      client_id: opts.clientId,
      callback: (res) => {
        const cred = res?.credential
        if (typeof cred === 'string' && cred.trim()) resolve(cred)
        else reject(new Error('Google did not return a credential'))
      },
    })
    google.accounts!.id!.prompt!()
  })
}

