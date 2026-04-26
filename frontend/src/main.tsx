import { AuthProvider } from '@asgardeo/auth-react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const authConfig = {
    signInRedirectURL: "http://localhost:5173",
    signOutRedirectURL: "http://localhost:5173",
    clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
    baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
    scope: [ "openid", "profile", "email" ]
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
        <App />
    </AuthProvider>
  </StrictMode>,
)
