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
    if (user) return
    initialize()
  }, [])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {showSOS && sosAlerts.length > 0 && <SOSAlert />}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {activeConvId ? <ChatPanel /> : <EmptyState />}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-white/5 bg-gray-900/60 flex-shrink-0">
        <NetworkBadge />
        <SOSButton />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-nexus-500/20 to-purple-500/20 border border-nexus-500/20 flex items-center justify-center mb-6">
          <span className="text-4xl">💬</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a conversation</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Pick a chat from the sidebar, or start a new conversation to begin messaging.
        </p>
      </div>
    </div>
  )
}
