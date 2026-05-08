import { useEffect } from 'react'
import { useStore } from '../store'
import Sidebar from '../components/Sidebar'
import ChatPanel from '../components/ChatPanel'
import SOSAlert from '../components/SOSAlert'
import NetworkBadge from '../components/NetworkBadge'
import SOSButton from '../components/SOSButton'

export default function ChatLayout() {
  const { initialize, user, sosAlerts, showSOS, activeConvId } = useStore()

  useEffect(() => {
    if (user) return          // already initialized by App
    initialize()
  }, [])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* SOS modal — sits above everything */}
      {showSOS && sosAlerts.length > 0 && <SOSAlert />}

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {activeConvId
          ? <ChatPanel />
          : <EmptyState />
        }
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-nexus-500/20 to-purple-500/20 border border-nexus-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl">💬</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a conversation</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Pick a chat from the sidebar, or start a new conversation to begin messaging.
      </p>
    </div>
  )
}
