import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { MessageCircle, User, Mail, Lock } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useStore()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return toast.error('Fill all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-nexus-600 rounded-full blur-3xl opacity-10" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-nexus-500/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Nexus Chat</h1>
          <p className="text-gray-400 mt-1 text-sm">Create your account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Get Started</h2>
          <form onSubmit={handle} className="space-y-4">
            {[
              { key: 'username', label: 'Username', icon: User, type: 'text', placeholder: 'Pick a username' },
              { key: 'email',    label: 'Email',    icon: Mail, type: 'email', placeholder: 'your@email.com' },
              { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Min 6 characters' },
              { key: 'confirm',  label: 'Confirm Password', icon: Lock, type: 'password', placeholder: 'Repeat password' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-2">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={f(key)}
                  placeholder={placeholder}
                  className="nexus-input w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-nexus-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-nexus-500/20 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-nexus-400 hover:text-nexus-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
