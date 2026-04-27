import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@asgardeo/auth-react'
import './index.css'
import App from './App.tsx'

const asgardeoConfig = {
  signInRedirectURL: `${window.location.origin}/login`,
  signOutRedirectURL: `${window.location.origin}/login`,
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
  scope: ['openid', 'profile', 'email'],
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={asgardeoConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
