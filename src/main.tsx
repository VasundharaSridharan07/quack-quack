import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ModusWcThemeProvider,
  setAssetPath,
} from '@trimble-oss/moduswebcomponents-react'
import './index.css'
import App from './App.tsx'

setAssetPath(`${window.location.origin}${import.meta.env.BASE_URL}`)

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModusWcThemeProvider
      initialTheme={{
        theme: 'modus-modern',
        mode: prefersDark ? 'dark' : 'light',
      }}
    >
      <App />
    </ModusWcThemeProvider>
  </StrictMode>,
)
