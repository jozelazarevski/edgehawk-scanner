import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

// Static hosts (GitHub Pages) have no SPA fallback — hash routing keeps
// deep links working there; the server build keeps BrowserRouter.
const Router = import.meta.env.VITE_STATIC === "1" ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <Router>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </Router>,
)
