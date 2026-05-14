import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/types'
import { loadRuntimeConfig } from './services/runtimeConfig'

document.documentElement.lang = 'he'
document.documentElement.dir = 'rtl'

async function bootstrap() {
  // Load runtime config (e.g. Google client id) once before the app renders.
  await loadRuntimeConfig()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()
