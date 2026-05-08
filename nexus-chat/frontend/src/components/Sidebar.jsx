import { useState, useRef } from 'react'
import { useStore } from '../store'
import {
  Search, Plus, Settings, LogOut, Users, MessageCircle,
  ChevronDown, Hash, Lock, Globe, User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from './Avatar'
import NewConversationModal from './NewConversationModal'
import UserSettingsModal from './UserSettingsModal'

export default function Sidebar() {
  const {
    user, conversations, activeConvId, setActiveConv,
    logout, allUsers, onlineUsers
  } = useStore()

  const [search, setSearch]       = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tab, setTab]             = useState('chats') // 'chats' | 'people'

  const filtered = conversations.filter(c =>
    (c.name || getMemberName(c, user?.id))
      .toLowerCase().includes(search.toLowerCase())
  )

  function getMemberName(conv, myId) {
    if (conv.type === 'group') return conv.name || 'Group'
    const other = (conv.members || []).find(m => m.id !== myId)
    return other?.username || conv.name || 'Chat'
  }

  function getMemberAvatar(conv, myId) {
    if (conv.type === 'group') return null
    return (conv.members || []).find(m => m.id !== myId)
  }

  function getOnlineOther(conv, myId) {
    if (conv.type === 'group') return false
    const other = (conv.members || []).find(m => m.id !== myId)
    return other ? onlineUsers.has(other.id) || other.is_online : false
  }

  return (
    <>
      <div className="w-72 flex flex-col bg-gray-900 border-r border-white/5 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-purple-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Nexus</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNew(true)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* My profile strip */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/3 border border-white/5">
            <Avatar user={user} size="sm" showOnline />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {[
            { id: 'chats',  label: 'Chats',  icon: MessageCircle },
            { id: 'people', label: 'People', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors
                ${tab === id
                  ? 'text-nexus-400 border-b-2 border-nexus-500'
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'chats' ? 'Search conversations…' : 'Search people…'}
              className="nexus-input w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {tab === 'chats' ? (
            filtered.length === 0
              ? <p className="text-xs text-gray-600 text-center mt-8">No conversations yet</p>
              : filtered.map(conv => {
                  const name   = getMemberName(conv, user?.id)
                  const other  = getMemberAvatar(conv, user?.id)
                  const isOnline = getOnlineOther(conv, user?.id)
                  const isActive = conv.id === activeConvId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv.id)}
                      className={`sidebar-item w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-0.5 text-left
                        ${isActive ? 'active' : ''}`}
                    >
                      {conv.type === 'group'
                        ? <GroupAvatar name={name} color={conv.avatar_color} />
                        : <Avatar user={other || { username: name, avatar_color: conv.avatar_color }} size="sm" showOnline={isOnline} />
                      }
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-200 truncate">{name}</span>
                          {conv.last_message_time && (
                            <span className="text-xs text-gray-600 flex-shrink-0 ml-1">
                              {formatDistanceToNow(new Date(conv.last_message_time + 'Z'), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">
                            {conv.last_message || 'No messages yet'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-nexus-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
          ) : (
            /* People tab */
            allUsers
              .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
              .map(u => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 cursor-pointer mb-0.5"
                  onClick={async () => {
                    // Find or create DM
                    const existing = conversations.find(c =>
                      c.type === 'direct' && c.members?.some(m => m.id === u.id)
                    )
                    if (existing) { setActiveConv(existing.id); setTab('chats') }
                    else {
                      const { createConversation, setActiveConv: sa } = useStore.getState()
                      const conv = await createConversation(null, 'direct', [u.id])
                      sa(conv.id); setTab('chats')
                    }
                  }}
                >
                  <Avatar user={u} size="sm" showOnline={onlineUsers.has(u.id) || u.is_online} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200">{u.username}</p>
                    <p className={`text-xs ${onlineUsers.has(u.id) || u.is_online ? 'text-green-400' : 'text-gray-600'}`}>
                      {onlineUsers.has(u.id) || u.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {showNew      && <NewConversationModal onClose={() => setShowNew(false)} />}
      {showSettings && <UserSettingsModal    onClose={() => setShowSettings(false)} />}
    </>
  )
}

function GroupAvatar({ name, color }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
      style={{ background: color || '#3d5eff' }}>
      {name?.[0]?.toUpperCase() || '#'}
    </div>
  )
}
