import { useState } from 'react'
import { useStore } from '../store'
import Avatar from './Avatar'
import {
  Users, MoreVertical, Sparkles, Gamepad2
} from 'lucide-react'
import GameModal from './GameModal'
import NetworkBadge from './NetworkBadge'
import SOSButton from './SOSButton'

export default function ChatHeader({ conv }) {
  const { user, onlineUsers, summarizeConversation } = useStore()
  const [showGame, setShowGame] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const other = conv.type === 'direct'
    ? (conv.members || []).find(m => m.id !== user?.id)
    : null

  const name    = conv.type === 'group' ? conv.name : other?.username || 'Chat'
  const isOnline = other ? onlineUsers.has(other.id) || other.is_online : false
  const memberCount = (conv.members || []).length

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-gray-900/60 backdrop-blur-sm flex-shrink-0">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {conv.type === 'group'
            ? (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: conv.avatar_color || '#3d5eff' }}>
                {name[0]?.toUpperCase()}
              </div>
            )
            : <Avatar user={other} size="md" showOnline={isOnline} />
          }
          <div className="min-w-0">
            <h2 className="font-semibold text-white text-sm truncate">{name}</h2>
            <p className="text-xs text-gray-500">
              {conv.type === 'group'
                ? `${memberCount} members`
                : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <NetworkBadge />

          {/* AI Summarize */}
          <button
            onClick={() => { useStore.getState().summarizeConversation() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors text-xs font-medium"
            title="AI Summarize"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Summarize</span>
          </button>

          {/* Games */}
          <button
            onClick={() => setShowGame(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-nexus-400 transition-colors"
            title="Play games"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 py-1">
                {[
                  { label: 'View Members', icon: Users, action: () => { setMenuOpen(false) } },
                  { label: 'AI Summarize', icon: Sparkles, action: () => { useStore.getState().summarizeConversation(); setMenuOpen(false) } },
                ].map(({ label, icon: Icon, action }) => (
                  <button key={label} onClick={action}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Icon className="w-4 h-4 text-gray-500" />{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SOSButton />
        </div>
      </div>

      {showGame && <GameModal conv={conv} onClose={() => setShowGame(false)} />}
    </>
  )
}
