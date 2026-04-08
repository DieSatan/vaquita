import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DashboardPage from './pages/DashboardPage'
import PayPage from './pages/PayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<DashboardPage />} />
        <Route path="/pay/:token" element={<PayPage />} />
      </Routes>
    </BrowserRouter>
  )
}
