import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'

// You MUST define VITE_GOOGLE_CLIENT_ID in your .env file
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
