import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Strategies from './pages/Strategies'
import Academy from './pages/Academy'
import Pricing from './pages/Pricing'
import Changelog from './pages/Changelog'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="scanner" element={<Scanner />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="academy" element={<Academy />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="changelog" element={<Changelog />} />
      </Route>
    </Routes>
  )
}
