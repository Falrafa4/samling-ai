import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/dm-sans";
import './index.css'
import App from './App.jsx'
import { initializeLocalStorage } from './utils/mockData'

// Initialize localStorage with mock data if not already present
initializeLocalStorage();

// Clean up dark mode remnants from previous runs to ensure light mode is standard
document.body.classList.remove("dark");
document.documentElement.classList.remove("dark");
localStorage.removeItem("theme");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

