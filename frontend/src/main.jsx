import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/dm-sans";
import './index.css'
import App from './App.jsx'
import { initializeLocalStorage } from './utils/mockData'

// Initialize localStorage with mock data if not already present
initializeLocalStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

