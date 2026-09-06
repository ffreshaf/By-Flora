import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/capacitor'
import * as SentryReact from '@sentry/react'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import App from './App.jsx'

Sentry.init(
  {
    dsn: 'https://6d3a416fd99e2f0dfa0f1fde9d3f9d10@o4512040452751360.ingest.de.sentry.io/4512040478376016',
  },
  SentryReact.init
);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)