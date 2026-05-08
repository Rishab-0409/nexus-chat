import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { MessageCircle, Wifi, Bluetooth, Shield } from 'lucide-react'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!identifier || !password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      await login(identifier, password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexus-600 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay:'1s'}} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-nexus-500/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Nexus Chat</h1>
          <p className="text-gray-400 mt-1 text-sm">Connect anywhere — online or offline</p>
        </div>

        {/* Features badges */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {[
            { icon: Wifi, label: 'Internet', color: 'text-green-400' },
            { icon: Bluetooth, label: 'Bluetooth', color: 'text-blue-400' },
            { icon: Shield, label: 'SOS Alert', color: 'text-red-400' },
          ].map(({ icon: Icon, label, color }) => (
            <span key={label} className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
              <Icon className={`w-3 h-3 ${color}`} />{label}
            </span>
          ))}
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Welcome back</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                className="nexus-input w-full rounded-xl px-4 py-3 text-sm"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="nexus-input w-full rounded-xl px-4 py-3 text-sm"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-nexus-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-nexus-500/20 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-nexus-400 hover:text-nexus-300 font-medium">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Username: <span className="text-gray-300 font-mono">demo</span> &nbsp; Password: <span className="text-gray-300 font-mono">demo123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
