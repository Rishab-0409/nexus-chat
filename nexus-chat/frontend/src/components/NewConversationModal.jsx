import { useState } from 'react'
import { useStore } from '../store'
import { X, Users, User, Search, Check } from 'lucide-react'
import Avatar from './Avatar'
import toast from 'react-hot-toast'

export default function NewConversationModal({ onClose }) {
  const { allUsers, user, createConversation, setActiveConv } = useStore()
  const [type, setType]       = useState('direct')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = allUsers.filter(u =>
    u.id !== user?.id &&
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (uid) => {
    if (type === 'direct') {
      setSelected([uid])
    } else {
      setSelected(p => p.includes(uid) ? p.filter(x => x !== uid) : [...p, uid])
    }
  }

  const handleCreate = async () => {
    if (!selected.length) return toast.error('Select at least one user')
    if (type === 'group' && !groupName.trim()) return toast.error('Enter a group name')
    setLoading(true)
    try {
      const conv = await createConversation(
        type === 'group' ? groupName.trim() : null,
        type,
        selected
      )
      setActiveConv(conv.id)
      toast.success(type === 'group' ? 'Group created!' : 'Conversation started!')
      onClose()
    } catch { toast.error('Failed to create conversation') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">New Conversation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
            {[
              { id: 'direct', label: 'Direct Message', icon: User },
              { id: 'group',  label: 'Group Chat',     icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setType(id); setSelected([]) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                  ${type === id ? 'bg-nexus-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Group name */}
          {type === 'group' && (
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name…"
              className="nexus-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
          )}

          {/* Search users */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="nexus-input w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
            />
          </div>

          {/* Selected users */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(uid => {
                const u = allUsers.find(x => x.id === uid)
                return (
                  <span key={uid} className="flex items-center gap-1 px-2 py-1 rounded-full bg-nexus-500/20 border border-nexus-500/30 text-xs text-nexus-300">
                    {u?.username}
                    <button onClick={() => toggle(uid)} className="ml-1 hover:text-white">×</button>
                  </span>
                )
              })}
            </div>
          )}

          {/* User list */}
          <div className="max-h-52 overflow-y-auto space-y-1">
            {filtered.length === 0
              ? <p className="text-sm text-gray-600 text-center py-4">No users found</p>
              : filtered.map(u => (
                  <button key={u.id} onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                      ${selected.includes(u.id) ? 'bg-nexus-500/15 border border-nexus-500/30' : 'hover:bg-white/5'}`}>
                    <Avatar user={u} size="sm" showOnline={u.is_online} />
                    <span className="text-sm text-gray-200 flex-1">{u.username}</span>
                    {selected.includes(u.id) && <Check className="w-4 h-4 text-nexus-400" />}
                  </button>
                ))
            }
          </div>

          <button onClick={handleCreate} disabled={loading || !selected.length}
            className="w-full py-3 rounded-xl bg-nexus-500 hover:bg-nexus-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-lg shadow-nexus-500/20">
            {loading ? 'Creating…' : type === 'group' ? 'Create Group' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  )
}
