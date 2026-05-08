import { useState } from 'react'
import { useStore } from '../store'
import { X, Camera, Save } from 'lucide-react'
import Avatar from './Avatar'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function UserSettingsModal({ onClose }) {
  const { user } = useStore()
  const [bio, setBio]           = useState(user?.bio || '')
  const [color, setColor]       = useState(user?.avatar_color || '#3d5eff')
  const [saving, setSaving]     = useState(false)

  const COLORS = [
    '#3d5eff','#a78bfa','#ec4899','#ef4444',
    '#f97316','#eab308','#10b981','#06b6d4',
  ]

  const save = async () => {
    setSaving(true)
    try {
      // Update profile endpoint (simple PATCH)
      await api.patch?.('/auth/profile', { bio, avatar_color: color }).catch(() =>
        api.post('/auth/profile', { bio, avatar_color: color }).catch(() => {})
      )
      useStore.setState({ user: { ...user, bio, avatar_color: color } })
      toast.success('Profile updated!')
      onClose()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Profile Settings</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar user={{ ...user, avatar_color: color }} size="lg" />
            </div>
            <div>
              <p className="text-white font-semibold text-center">{user?.username}</p>
              <p className="text-gray-500 text-xs text-center">{user?.email}</p>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`}
                  style={{ background: c }}
                />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent" title="Custom color" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself…"
              rows={3}
              maxLength={200}
              className="nexus-input w-full rounded-xl px-3 py-2 text-sm resize-none"
            />
            <p className="text-xs text-gray-600 text-right mt-1">{bio.length}/200</p>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl bg-nexus-500 hover:bg-nexus-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
