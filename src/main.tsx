import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@fontsource/press-start-2p";
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
