import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from './store'
import ChatLayout from './pages/ChatLayout'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  const { token, user, initialize } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (token && !user) {
      initialize().catch(() => navigate('/login'))
    }
  }, [])

  if (!token) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ChatLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
